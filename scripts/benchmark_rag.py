"""Sequential loopback SSE benchmark; isolated storage and existing local models.

Model-cold means explicitly unloaded, not a cold operating-system file cache.
RSS is sampled and may count shared pages twice. Ollama VRAM is separate.
No production settings, vectors, credentials or model downloads are changed.
"""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import platform
import secrets
import socket
import statistics
import subprocess
import sys
import tempfile
import threading
import time

import psutil
import requests

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(ROOT / "scripts"))
from evaluate_answers import check_answer, metrics


def distribution(values):
    values = sorted(value for value in values if value is not None)
    if not values:
        return {"samples": 0}
    return {"samples": len(values), "median": round(statistics.median(values), 4),
            "p95": round(values[math.ceil(len(values)*0.95)-1], 4),
            "min": round(values[0], 4), "max": round(values[-1], 4)}


def decode_events(lines):
    """Reject incomplete streams; do not turn an error event into success."""
    done = False
    for line in lines:
        if not line.startswith("data: "):
            continue
        event = json.loads(line[6:])
        if event["type"] == "error":
            raise RuntimeError(event["detail"])
        if done:
            raise RuntimeError("Event after stream completion")
        done = event["type"] == "done"
        yield event
    if not done:
        raise RuntimeError("Stream ended without a done event")


class MemorySampler:
    def __init__(self, backend_pid):
        self.backend = psutil.Process(backend_pid)
        self.stop = threading.Event()
        self.peaks = {"backend_rss_bytes": 0, "ollama_rss_bytes": 0, "combined_rss_bytes": 0}
        self.samples = 0
        self.errors = 0

    def sample(self):
        try:
            # Windows venv python.exe can be a launcher whose child owns the
            # actual interpreter/model. Include its complete process tree.
            processes = {p.pid: p for p in [self.backend, *self.backend.children(recursive=True)]}
            backend = sum(p.memory_info().rss for p in processes.values())
            ollama = sum(process.memory_info().rss for process in psutil.process_iter(["name"])
                         if "ollama" in (process.info["name"] or "").lower())
            self.samples += 1
            for key, value in (("backend_rss_bytes", backend), ("ollama_rss_bytes", ollama),
                               ("combined_rss_bytes", backend + ollama)):
                self.peaks[key] = max(self.peaks[key], value)
        except (psutil.Error, OSError):
            self.errors += 1

    def __enter__(self):
        self.sample()
        def watch():
            while not self.stop.wait(0.1):
                self.sample()
        self.thread = threading.Thread(target=watch, daemon=True)
        self.thread.start()
        return self

    def __exit__(self, *args):
        self.sample()
        self.stop.set()
        self.thread.join()

    def result(self):
        return {**self.peaks, "samples": self.samples, "sampling_errors": self.errors,
                "interval_seconds": 0.1}


def ask(session, url, body, pid):
    started = time.perf_counter()
    first_token = None
    first_sources = None
    parts, citations = [], []
    with MemorySampler(pid) as sampler:
        with session.post(url + "/ask/stream", json=body, stream=True, timeout=(5, 180)) as response:
            response.raise_for_status()
            for event in decode_events(response.iter_lines(chunk_size=1, decode_unicode=True)):
                elapsed = time.perf_counter() - started
                if event["type"] == "sources":
                    first_sources = elapsed
                    citations = event["citations"]
                elif event["type"] == "token" and event["text"]:
                    if first_token is None:
                        first_token = elapsed
                    parts.append(event["text"])
                elif event["type"] == "done":
                    total = elapsed
    return {"answer": "".join(parts), "citations": citations,
            "first_token_seconds": first_token, "sources_seconds": first_sources,
            "total_seconds": total, "memory": sampler.result()}


def serve(args):
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    from app.core.storage import Storage
    from app.core.memory import MemoryBank
    from app.core.amd_bridge import AMDBridge
    from app.main import create_app
    from app.schemas import Settings
    import uvicorn
    brain = AMDBridge()
    memory = MemoryBank(brain=brain, client=chromadb.PersistentClient(
        path=str(args.data_dir / "vectors"), settings=ChromaSettings(anonymized_telemetry=False)))
    for document in json.loads(args.corpus.read_text(encoding="utf-8"))["documents"]:
        memory.ingest_document(document["source"], document["pages"])
    store = Storage(args.data_dir / "metadata.sqlite3")
    store.set("settings", Settings(model=args.models[0]).model_dump())
    store.set("agents", [])
    store.set("meetings", {"notes": "", "tasks": []})
    app = create_app(storage=store, memory_factory=lambda: memory)
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="error")


def benchmark(args):
    if args.output.exists():
        raise ValueError("Choose a new output file; benchmarks must preserve previous runs")
    corpus_raw = args.corpus.read_bytes()
    checks_raw = args.checks.read_bytes()
    corpus, checks = json.loads(corpus_raw), json.loads(checks_raw)
    ollama = requests.Session()
    ollama.trust_env = False
    base = "http://127.0.0.1:11434"
    tags_response = ollama.get(base + "/api/tags", timeout=5)
    tags_response.raise_for_status()
    tags = {model["name"]: model for model in tags_response.json()["models"]}
    if any(model not in tags for model in args.models):
        raise ValueError("Choose installed Ollama model tags; this benchmark never downloads models")
    def loaded():
        response = ollama.get(base + "/api/ps", timeout=5)
        response.raise_for_status()
        return response.json()["models"]
    def unload(model):
        response = ollama.post(base + "/api/generate", json={"model": model, "keep_alive": 0}, timeout=120)
        response.raise_for_status()
        deadline = time.monotonic() + 30
        while any(item["name"] == model for item in loaded()):
            if time.monotonic() > deadline:
                raise RuntimeError("Could not verify model unload")
            time.sleep(0.2)
    if any(item["name"] not in args.models for item in loaded()):
        raise RuntimeError("An unrelated model is loaded; stop its use before an isolated comparison")
    result = {"product_revision": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
              "created_utc": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
              "corpus_sha256": hashlib.sha256(corpus_raw).hexdigest(),
              "checks_sha256": hashlib.sha256(checks_raw).hexdigest(),
              "host": {"platform": platform.platform(), "python": platform.python_version(),
                       "logical_cpus": psutil.cpu_count(), "total_ram_bytes": psutil.virtual_memory().total},
              "method": {"transport": "real loopback FastAPI HTTP/SSE; frontend proxy/browser excluded",
                         "model_cold": "model explicitly unloaded and /api/ps checked; OS cache not flushed",
                         "warm_repeats": args.warm_repeats, "cold_repeats": args.cold_repeats,
                         "memory": "100ms sampled backend process-tree RSS and all Ollama processes; shared pages may double count",
                         "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                         "execution": "models sequential; no other benchmark/test workloads launched"}, "models": []}
    def save():
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    scratch = ROOT / ".tmp"
    scratch.mkdir(exist_ok=True)
    for model in args.models:
        for selected in args.models:
            unload(selected)
        with tempfile.TemporaryDirectory(prefix="synapse-perf-", dir=scratch) as directory:
            path = Path(directory)
            with socket.socket() as probe:
                probe.bind(("127.0.0.1", 0))
                port = probe.getsockname()[1]
            env = os.environ.copy()
            env["SYNAPSE_DATA_DIR"] = str(path)
            env["SYNAPSE_API_TOKEN"] = secrets.token_urlsafe(48)
            api = requests.Session()
            api.trust_env = False
            api.headers["Authorization"] = "Bearer " + env["SYNAPSE_API_TOKEN"]
            url = f"http://127.0.0.1:{port}"
            with (path / "server.log").open("w", encoding="utf-8") as log:
                process = subprocess.Popen([sys.executable, str(Path(__file__).resolve()), "--serve", "--models", model,
                    "--corpus", str(args.corpus.resolve()), "--data-dir", directory, "--port", str(port)],
                    env=env, stdout=log, stderr=log)
                try:
                    deadline = time.monotonic() + 120
                    while True:
                        if process.poll() is not None:
                            raise RuntimeError((path / "server.log").read_text()[-2000:])
                        try:
                            api.get(url + "/health/live", timeout=1).raise_for_status()
                            break
                        except requests.RequestException:
                            if time.monotonic() > deadline:
                                raise RuntimeError("Benchmark backend startup timed out")
                            time.sleep(0.2)
                    entry = {"model": model, "installed": tags[model], "cold": [], "warm": [],
                             "long_session": [], "ingestion": []}
                    result["models"].append(entry)
                    def new_conversation():
                        response = api.post(url + "/conversations", timeout=5)
                        response.raise_for_status()
                        return response.json()["id"]
                    for index in range(args.cold_repeats):
                        unload(model)
                        row = ask(api, url, {"text": corpus["cases"][0]["query"],
                            "selected_sources": corpus["cases"][0]["sources"],
                            "conversation_id": new_conversation()}, process.pid)
                        row.update(id=corpus["cases"][0]["id"], repeat=index)
                        row.update(check_answer(corpus["cases"][0], row, checks[row["id"]]))
                        entry["cold"].append(row)
                        save()
                        print(model, "cold", index + 1, round(row["total_seconds"], 2), flush=True)
                    for repeat in range(args.warm_repeats):
                        for case in corpus["cases"]:
                            identifier = new_conversation()
                            rules = checks[case["id"]]
                            if case["kind"] == "follow-up":
                                ask(api, url, {"text": case["history"][0]["content"], "conversation_id": identifier,
                                    "selected_sources": rules.get("seed_sources", case["sources"])}, process.pid)
                            row = ask(api, url, {"text": case["query"], "selected_sources": case["sources"],
                                               "conversation_id": identifier}, process.pid)
                            saved = api.get(url + "/conversations/" + identifier, timeout=5)
                            saved.raise_for_status()
                            row.update(id=case["id"], repeat=repeat,
                                conversation_persisted=len(saved.json()) == (4 if case["kind"] == "follow-up" else 2))
                            row.update(check_answer(case, row, rules))
                            entry["warm"].append(row)
                            save()
                        print(model, "warm pass", repeat + 1, flush=True)
                    identifier = new_conversation()
                    for turn in range(args.session_turns):
                        row = ask(api, url, {"text": corpus["cases"][0]["query"],
                            "selected_sources": corpus["cases"][0]["sources"], "conversation_id": identifier}, process.pid)
                        row.update(turn=turn + 1)
                        row.update(check_answer(corpus["cases"][0], row, checks[corpus["cases"][0]["id"]]))
                        entry["long_session"].append(row)
                    saved = api.get(url + "/conversations/" + identifier, timeout=5)
                    saved.raise_for_status()
                    entry["session_persistence_passed"] = len(saved.json()) == 2 * args.session_turns
                    payload = ("Saturn research budget and meeting equipment. " * 1500).encode()
                    for index in range(3):
                        started = time.perf_counter()
                        response = api.post(url + "/upload", files={"file": (f"throughput-{index}.md", payload)}, timeout=120)
                        response.raise_for_status()
                        elapsed = time.perf_counter() - started
                        entry["ingestion"].append({"bytes": len(payload), "seconds": elapsed,
                            "bytes_per_second": len(payload)/elapsed, "result": response.json()})
                    entry["ollama_allocation_snapshot"] = loaded()
                    entry["quality_diagnostics"] = metrics(entry["warm"])
                    entry["session_quality_diagnostics"] = metrics(entry["long_session"])
                    entry["timing_summary"] = {phase: {field: distribution([r[field] for r in entry[phase]])
                        for field in ("first_token_seconds", "total_seconds")} for phase in ("cold", "warm", "long_session")}
                    save()
                    print(model, "completed", flush=True)
                finally:
                    process.terminate()
                    try:
                        process.wait(timeout=15)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait(timeout=5)
                    api.close()
            unload(model)
    ollama.close()
    save()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--models", nargs="+", default=["llama3:latest", "llama3.2:latest"])
    parser.add_argument("--corpus", type=Path, default=ROOT / "evaluations/external-holdout-corpus.json")
    parser.add_argument("--checks", type=Path, default=ROOT / "evaluations/external-holdout-checks.json")
    parser.add_argument("--output", type=Path, default=ROOT / "evaluations/results/performance-first-run.json")
    parser.add_argument("--cold-repeats", type=int, default=3)
    parser.add_argument("--warm-repeats", type=int, default=2)
    parser.add_argument("--session-turns", type=int, default=12)
    parser.add_argument("--serve", action="store_true", help=argparse.SUPPRESS)
    parser.add_argument("--data-dir", type=Path, help=argparse.SUPPRESS)
    parser.add_argument("--port", type=int, help=argparse.SUPPRESS)
    args = parser.parse_args()
    if min(args.cold_repeats, args.warm_repeats, args.session_turns) < 1:
        parser.error("Repeat/turn counts must be positive")
    if args.serve:
        if args.data_dir is None or args.port is None:
            parser.error("Internal server requires isolated data and port")
        serve(args)
    else:
        benchmark(args)
