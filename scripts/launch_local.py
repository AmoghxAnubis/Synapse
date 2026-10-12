"""Foreground Windows beta launcher; no installation or model downloads."""
import argparse
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"


def backend_child():
    # Closing the supervisor's stdin pipe also stops the backend after a launcher exit.
    sys.path.insert(0, str(BACKEND))
    import uvicorn
    server = uvicorn.Server(uvicorn.Config("app.main:app", host="127.0.0.1", port=8000))

    def watch_parent():
        sys.stdin.readline()
        server.should_exit = True

    threading.Thread(target=watch_parent, daemon=True).start()
    server.run()


def data_directory(value=None):
    if value:
        return Path(value).expanduser().resolve()
    base = os.environ.get("LOCALAPPDATA")
    if not base:
        raise RuntimeError("LOCALAPPDATA is unavailable. Supply --data-dir explicitly.")
    return Path(base) / "Synapse" / "data"


def require_free_ports():
    for port in (8000, 3000):
        with socket.socket() as probe:
            if probe.connect_ex(("127.0.0.1", port)) == 0:
                raise RuntimeError(f"Port {port} is already in use. Stop the existing service first; the launcher will not stop it.")


def preflight(node_command=None):
    bundled_python = BACKEND / "runtime" / "python.exe"
    python = bundled_python if bundled_python.is_file() else BACKEND / "venv" / "Scripts" / "python.exe"
    if not python.is_file():
        raise RuntimeError("Create backend/venv with Python 3.12 and install requirements.lock.txt; see README.")
    try:
        version = subprocess.check_output([str(python), "-c", "import sys; print('%s.%s' % sys.version_info[:2])"], text=True, stderr=subprocess.STDOUT).strip()
        if version != "3.12":
            raise RuntimeError(f"Backend Python {version} is unsupported by this beta launcher; use Python 3.12.")
        subprocess.run([str(python), "-c", "import uvicorn, fastapi, onnxruntime, chromadb, langchain_ollama, langgraph"], check=True, capture_output=True)
    except subprocess.CalledProcessError as exc:
        raise RuntimeError("Backend runtime or dependencies are unavailable. Recreate the Python 3.12 environment from the lockfile.") from exc
    bundled_node = ROOT / "runtime" / "node" / "node.exe"
    node = shutil.which(node_command or (str(bundled_node) if bundled_node.is_file() else "node"))
    if not node:
        raise RuntimeError("Install Node 22.13 or newer; see README.")
    version = subprocess.check_output([node, "--version"], text=True).strip().lstrip("v")
    if tuple(int(part) for part in version.split(".")[:2]) < (22, 13):
        raise RuntimeError(f"Node {version} is too old; use Node 22.13 or newer.")
    next_cli = FRONTEND / "server.js"
    if not next_cli.is_file():
        next_cli = FRONTEND / "node_modules" / "next" / "dist" / "bin" / "next"
    if not next_cli.is_file() or not (FRONTEND / ".next" / "BUILD_ID").is_file():
        raise RuntimeError("Run npm.cmd ci and npm.cmd run build in frontend first.")
    require_free_ports()
    return python, node, next_cli


def http_status(url):
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        with opener.open(url, timeout=2) as response:
            return response.status
    except urllib.error.HTTPError as exc:
        return exc.code
    except (OSError, urllib.error.URLError):
        return None


def stop_services(backend, frontend):
    # Stop the stateless frontend first, then let backend lifespan close jobs/stores.
    if frontend and frontend.poll() is None:
        frontend.terminate()
    if backend and backend.poll() is None:
        try:
            backend.stdin.write("stop\n")
            backend.stdin.flush()
        except (OSError, BrokenPipeError):
            pass
    for name, process in (("frontend", frontend), ("backend", backend)):
        if not process:
            continue
        try:
            process.wait(timeout=30)
        except subprocess.TimeoutExpired:
            print(f"{name} did not stop within 30 seconds; terminating this launcher's process.", file=sys.stderr)
            process.kill()
            process.wait(timeout=5)
    if backend and backend.stdin:
        backend.stdin.close()


def launch(args):
    python, node, next_cli = preflight(args.node)
    data = data_directory(args.data_dir)
    embedding = Path(args.embedding_dir).expanduser().resolve() if args.embedding_dir else data / "models" / "minilm"
    print(f"Data: {data}")
    print(f"Embeddings: {embedding}")
    model_ready = (embedding / "model.onnx").is_file() or (embedding / "onnx" / "model.onnx").is_file()
    print("Embedding model present." if model_ready else "Embedding model missing: follow the explicit provisioning steps in docs/WINDOWS_LAUNCHER.md.")
    print("Ollama is reachable." if http_status("http://127.0.0.1:11434/api/tags") == 200 else "Ollama is unavailable. Pairing/settings will work; start Ollama for answers.")
    if args.check:
        print("Prerequisite check passed. No services started.")
        return
    logs = data / "logs"
    logs.mkdir(parents=True, exist_ok=True)
    env = dict(os.environ, SYNAPSE_DATA_DIR=str(data), SYNAPSE_EMBEDDING_DIR=str(embedding), SYNAPSE_BACKEND_URL="http://127.0.0.1:8000", PYTHONUNBUFFERED="1", HOSTNAME="127.0.0.1", PORT="3000", NEXT_TELEMETRY_DISABLED="1")
    frontend_command = [node, str(next_cli)] if next_cli.name == "server.js" else [node, str(next_cli), "start", "--hostname", "127.0.0.1", "--port", "3000"]
    backend = frontend = None
    with (logs / "backend.log").open("a", encoding="utf-8") as backend_log, (logs / "frontend.log").open("a", encoding="utf-8") as frontend_log:
        try:
            backend = subprocess.Popen([str(python), "-u", str(Path(__file__).resolve()), "--backend-child"], cwd=BACKEND, env=env, stdin=subprocess.PIPE, stdout=backend_log, stderr=subprocess.STDOUT, text=True)
            frontend = subprocess.Popen(frontend_command, cwd=FRONTEND, env=env, stdout=frontend_log, stderr=subprocess.STDOUT)
            deadline = time.monotonic() + 60
            while True:
                if backend.poll() is not None or frontend.poll() is not None:
                    raise RuntimeError(f"A local service exited. Inspect logs in {logs}.")
                if http_status("http://127.0.0.1:8000/") == 401 and http_status("http://127.0.0.1:3000/") == 200:
                    break
                if time.monotonic() >= deadline:
                    raise RuntimeError(f"Local services were not ready within 60 seconds. Inspect logs in {logs}.")
                time.sleep(0.25)
            print("Ready: http://127.0.0.1:3000")
            print(f"Pair with the token in {data / 'api-token'} (keep its contents private).")
            print("Press Ctrl+C in this terminal to stop both services.", flush=True)
            if args.open_browser:
                import webbrowser
                webbrowser.open("http://127.0.0.1:3000")
            if not args.smoke:
                while backend.poll() is None and frontend.poll() is None:
                    time.sleep(0.5)
                raise RuntimeError(f"A local service stopped unexpectedly. Inspect logs in {logs}.")
        finally:
            stop_services(backend, frontend)
    print("Local services stopped; user data retained.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", help="Default: %%LOCALAPPDATA%%/Synapse/data; never auto-migrates old data.")
    parser.add_argument("--embedding-dir", help="Use an already provisioned embedding directory.")
    parser.add_argument("--node", help="Explicit Node executable when PATH selects another installation.")
    parser.add_argument("--check", action="store_true", help="Check prerequisites without launching.")
    parser.add_argument("--smoke", action="store_true", help="Start, verify HTTP readiness, and stop both services.")
    parser.add_argument("--open-browser", action="store_true", help="Open the local page after readiness.")
    parser.add_argument("--backend-child", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    if args.backend_child:
        try:
            backend_child()
        except KeyboardInterrupt:
            pass
        return
    try:
        launch(args)
    except KeyboardInterrupt:
        print("Local services stopped; user data retained.")
    except (OSError, ValueError, RuntimeError) as exc:
        print(f"Launcher: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
