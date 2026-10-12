"""Real bundled API/embedding regression under redirected logs and supervised stdin."""
import argparse
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


def verify(bundle, embeddings):
    bundle = Path(bundle).resolve()
    embeddings = Path(embeddings).resolve()
    with socket.socket() as probe:
        if probe.connect_ex(("127.0.0.1", 8000)) == 0:
            raise RuntimeError("Port 8000 is occupied; stop the existing service first.")
    scratch = ROOT / ".tmp"
    scratch.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="bundle-api-", dir=scratch) as directory:
        data = Path(directory) / "data"
        environment = dict(os.environ, SYNAPSE_DATA_DIR=str(data), SYNAPSE_EMBEDDING_DIR=str(embeddings), PYTHONUNBUFFERED="1", PYTHONDONTWRITEBYTECODE="1")
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with (Path(directory) / "backend.log").open("w", encoding="utf-8") as log:
            child = subprocess.Popen([str(bundle / "backend" / "runtime" / "python.exe"), "-u", str(bundle / "scripts" / "launch_local.py"), "--backend-child"], cwd=bundle / "backend", env=environment, stdin=subprocess.PIPE, stdout=log, stderr=subprocess.STDOUT, text=True)
            try:
                deadline = time.monotonic() + 45
                while True:
                    if child.poll() is not None:
                        raise RuntimeError("Bundled API exited during startup.")
                    try:
                        with opener.open("http://127.0.0.1:8000/health/live", timeout=2) as response:
                            if response.status == 200:
                                break
                    except (OSError, urllib.error.URLError):
                        pass
                    if time.monotonic() > deadline:
                        raise RuntimeError("Bundled API startup timed out.")
                    time.sleep(0.2)
                token = (data / "api-token").read_text().strip()

                def call(path, body=None, method=None, extra_headers=None):
                    headers = {"Authorization": "Bearer " + token, **(extra_headers or {})}
                    request = urllib.request.Request("http://127.0.0.1:8000" + path, data=body, headers=headers, method=method)
                    with opener.open(request, timeout=30) as response:
                        return json.load(response)

                assert call("/sources") == [], "First-load source request failed"
                boundary = "synapse-bundle-acceptance"
                body = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="bundle-test.md"\r\nContent-Type: text/markdown\r\n\r\nThe bundle acceptance owner is Mira Patel.\r\n--{boundary}--\r\n').encode()
                job = call("/ingestion/jobs", body=body, extra_headers={"Content-Type": "multipart/form-data; boundary=" + boundary})
                for _ in range(100):
                    result = call("/jobs/" + job["id"])
                    if result["status"] not in ("queued", "running"):
                        break
                    time.sleep(0.2)
                assert result["status"] == "completed", result
                assert call("/sources")[0]["name"] == "bundle-test.md"
                print("PASS: supervised bundled API first-load, real ONNX/Chroma import and source persistence")
            finally:
                if child.poll() is None:
                    try:
                        child.stdin.write("stop\n")
                        child.stdin.flush()
                        child.wait(timeout=30)
                    except (OSError, subprocess.TimeoutExpired):
                        child.kill()
                        child.wait(timeout=5)
                child.stdin.close()
        with socket.socket() as probe:
            assert probe.connect_ex(("127.0.0.1", 8000)) != 0
        print("PASS: bundled backend shutdown and port release")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", required=True)
    parser.add_argument("--embedding-dir", required=True)
    arguments = parser.parse_args()
    verify(arguments.bundle, arguments.embedding_dir)
