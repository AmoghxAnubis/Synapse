"""Stage a relocatable Windows bundle from verified local runtimes; optionally compile NSIS."""
import argparse
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import shutil
import struct
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def copy_tree(source, target):
    shutil.copytree(source, target, dirs_exist_ok=True,
                    ignore=shutil.ignore_patterns(".env", ".env.*", "__pycache__", "*.pyc", ".synapse", ".git"))


def build(args):
    if os.name != "nt" or sys.version_info[:2] != (3, 12) or struct.calcsize("P") != 8:
        raise RuntimeError("Build with the locked Windows x64 Python 3.12 virtual environment.")
    output = Path(args.output).resolve()
    if output.exists():
        raise RuntimeError("Output must be a new directory. Existing packages are never overwritten.")
    standalone = ROOT / "frontend" / ".next" / "standalone"
    if not (standalone / "server.js").is_file():
        raise RuntimeError("Run npm.cmd run build with output: standalone first.")
    node_dir = Path(args.node_dir).resolve()
    if not (node_dir / "node.exe").is_file() or not (node_dir / "LICENSE").is_file():
        raise RuntimeError("Supply an extracted official Node Windows x64 archive with node.exe and LICENSE.")
    node_version = subprocess.check_output([str(node_dir / "node.exe"), "--version"], text=True).strip()
    if tuple(map(int, node_version.lstrip("v").split(".")[:2])) < (22, 13):
        raise RuntimeError("Node 22.13 or newer is required.")
    lock = ROOT / "backend" / "requirements.lock.txt"
    for line in lock.read_text(encoding="utf-8-sig").splitlines():
        if not line or line.startswith("#"):
            continue
        name, version = line.split("==", 1)
        if importlib.metadata.version(name) != version:
            raise RuntimeError(f"Installed {name} differs from the backend lock; install the lock before packaging.")
    packages = Path(sys.prefix) / "Lib" / "site-packages"
    for pth in packages.glob("*.pth"):
        for line in pth.read_text().splitlines():
            if line and not line.startswith(("#", "import ")):
                resolved = (packages / line).resolve()
                if not resolved.is_relative_to(packages.resolve()):
                    raise RuntimeError(f"Nonportable site-package path in {pth.name}.")
    print("Staging Python runtime and locked dependencies...", flush=True)
    python = output / "backend" / "runtime"
    python.mkdir(parents=True)
    base = Path(sys.base_prefix)
    for pattern in ("python.exe", "pythonw.exe", "python*.dll", "vcruntime*.dll", "LICENSE.txt"):
        for file in base.glob(pattern):
            shutil.copy2(file, python / file.name)
    if not (python / "LICENSE.txt").is_file():
        raise RuntimeError("Python runtime license is missing.")
    shutil.copytree(base / "Lib", python / "Lib", ignore=shutil.ignore_patterns("site-packages", "__pycache__", "*.pyc"))
    copy_tree(base / "DLLs", python / "DLLs")
    copy_tree(packages, python / "Lib" / "site-packages")
    # An isolated path file avoids user-site/PYTHONPATH and the builder's absolute prefix.
    (python / "python312._pth").write_text(".\nLib\nLib/site-packages\n..\nimport site\n", encoding="utf-8")
    print("Staging backend and standalone frontend...", flush=True)
    copy_tree(ROOT / "backend" / "app", output / "backend" / "app")
    shutil.copy2(lock, output / "backend" / "requirements.lock.txt")
    copy_tree(standalone, output / "frontend")
    copy_tree(ROOT / "frontend" / ".next" / "static", output / "frontend" / ".next" / "static")
    copy_tree(ROOT / "frontend" / "public", output / "frontend" / "public")
    node = output / "runtime" / "node"
    node.mkdir(parents=True)
    for name in ("node.exe", "LICENSE"):
        shutil.copy2(node_dir / name, node / name)
    (output / "scripts").mkdir()
    shutil.copy2(ROOT / "scripts" / "launch_local.py", output / "scripts" / "launch_local.py")
    (output / "Start-Synapse.cmd").write_text('@echo off\n"%~dp0backend\\runtime\\python.exe" "%~dp0scripts\\launch_local.py" --open-browser %*\nexit /b %errorlevel%\n')
    (output / "docs").mkdir()
    shutil.copy2(ROOT / "docs" / "WINDOWS_INSTALLER.md", output / "docs" / "WINDOWS_INSTALLER.md")
    shutil.copy2(ROOT / "README.md", output / "README.md")
    print("Verifying relocated Python imports...", flush=True)
    subprocess.run([str(python / "python.exe"), "-c", "import uvicorn,fastapi,onnxruntime,chromadb,langchain_ollama,langgraph; print('Bundled imports passed')"], cwd=output, check=True)
    files = []
    for file in sorted(output.rglob("*")):
        if file.is_file():
            if file.name.startswith(".env") or file.name in ("api-token", "agents.json", "meetings_data.json"):
                raise RuntimeError(f"Private file detected in payload: {file.relative_to(output)}")
            with file.open("rb") as stream:
                digest = hashlib.file_digest(stream, "sha256").hexdigest()
            files.append({"path": file.relative_to(output).as_posix(), "bytes": file.stat().st_size, "sha256": digest})
    try:
        commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    except (OSError, subprocess.CalledProcessError):
        commit = "unknown"
    manifest = {"format": "synapse-windows-bundle-v1", "version": "0.2.0-beta.1", "source_commit": commit,
                "python": sys.version.split()[0], "node": node_version, "backend_lock_sha256": hashlib.sha256(lock.read_bytes()).hexdigest(), "files": files}
    (output / "package-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Bundle: {output}; {len(files)} files; {sum(f['bytes'] for f in files) / 1024**2:.1f} MiB", flush=True)
    if args.nsis:
        installer = output.parent / (output.name + "-setup.exe")
        if installer.exists():
            raise RuntimeError("Installer output already exists; choose a new bundle output name.")
        subprocess.run([args.nsis, f"/DPAYLOAD={output}", f"/DOUTPUT={installer}", str(ROOT / "packaging" / "windows" / "synapse.nsi")], check=True)
        print(f"Installer: {installer}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--node-dir", required=True)
    parser.add_argument("--output", default="dist/synapse-win-x64")
    parser.add_argument("--nsis", help="Path to makensis.exe to compile the installer after staging.")
    arguments = parser.parse_args()
    try:
        build(arguments)
    except (OSError, ValueError, RuntimeError, subprocess.CalledProcessError, importlib.metadata.PackageNotFoundError) as exc:
        print(f"Package build: {exc}", file=sys.stderr)
        sys.exit(1)
