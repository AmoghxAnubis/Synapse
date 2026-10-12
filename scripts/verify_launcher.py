"""Isolated real-process launcher startup, restart and port-conflict acceptance."""
import argparse
from contextlib import closing
import hashlib
from pathlib import Path
import socket
import sqlite3
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def verify(node=None):
    scratch = ROOT / ".tmp"
    scratch.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="launcher-", dir=scratch) as directory:
        data = Path(directory) / "data"
        command = [sys.executable, str(ROOT / "scripts" / "launch_local.py"), "--smoke", "--data-dir", str(data)]
        if node:
            command.extend(["--node", node])
        for run in (1, 2):
            result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, timeout=120)
            if result.returncode:
                raise RuntimeError(result.stderr or result.stdout)
            assert "Ready:" in result.stdout and "Local services stopped" in result.stdout
            token_hash = hashlib.sha256((data / "api-token").read_bytes()).hexdigest()
            with closing(sqlite3.connect(data / "metadata.sqlite3")) as db:
                if run == 1:
                    db.execute("INSERT INTO kv(key,value) VALUES (?,?)", ("launcher_acceptance", '"preserved"'))
                    db.commit()
                    original_token_hash = token_hash
                else:
                    assert db.execute("SELECT value FROM kv WHERE key='launcher_acceptance'").fetchone()[0] == '"preserved"'
                    assert original_token_hash == token_hash
            for port in (3000, 8000):
                with socket.socket() as connection:
                    assert connection.connect_ex(("127.0.0.1", port)) != 0, f"Service still listening on {port}"
            print(f"PASS: start/stop {run}; service ports released; data/token preserved")
        with socket.socket() as occupied:
            occupied.bind(("127.0.0.1", 3000))
            occupied.listen()
            result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, timeout=60)
            assert result.returncode == 1 and "Port 3000 is already in use" in result.stderr
            with socket.socket() as connection:
                assert connection.connect_ex(("127.0.0.1", 3000)) == 0
            print("PASS: occupied port refused; existing listener retained")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--node")
    arguments = parser.parse_args()
    verify(arguments.node)
