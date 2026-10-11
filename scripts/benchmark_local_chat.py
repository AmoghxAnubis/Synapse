"""Small repeatable Q02 screening of local retrieval plus streamed generation.

Measures graph events inside one process. It excludes HTTP/browser transport,
Ollama's separate-process memory, and a true unloaded-model cold start.
"""
import argparse
import ctypes
import json
import os
import statistics
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))


def backend_working_set_mb():
    if os.name != "nt":
        return None
    class Counters(ctypes.Structure):
        _fields_ = [("cb", ctypes.c_ulong), ("PageFaultCount", ctypes.c_ulong)] + [
            (name, ctypes.c_size_t) for name in (
                "PeakWorkingSetSize", "WorkingSetSize", "QuotaPeakPagedPoolUsage",
                "QuotaPagedPoolUsage", "QuotaPeakNonPagedPoolUsage", "QuotaNonPagedPoolUsage",
                "PagefileUsage", "PeakPagefileUsage", "PrivateUsage")]
    counters = Counters()
    counters.cb = ctypes.sizeof(Counters)
    ctypes.windll.psapi.GetProcessMemoryInfo.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_ulong]
    ok = ctypes.windll.psapi.GetProcessMemoryInfo(
        ctypes.windll.kernel32.GetCurrentProcess(), ctypes.byref(counters), counters.cb)
    return round(counters.WorkingSetSize / 1048576, 1) if ok else None


def worker(args):
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    from app.core.amd_bridge import AMDBridge
    from app.core.llm import LocalLLM
    from app.core.memory import MemoryBank
    from app.core.storage import Storage
    from app.main import Services
    from app.schemas import Query, Settings
    from app.workflows.chat import stream_chat

    corpus = json.loads(args.corpus.read_text(encoding="utf-8"))
    memory = MemoryBank(brain=AMDBridge(), client=chromadb.PersistentClient(
        path=str(args.data_dir / "vectors"), settings=ChromaSettings(anonymized_telemetry=False)))
    started = time.perf_counter()
    for document in corpus["documents"]:
        memory.ingest_document(document["source"], document["pages"])
    ingestion_seconds = round(time.perf_counter() - started, 3)
    store = Storage(args.data_dir / "metadata.sqlite3")
    store.set("settings", Settings(model=args.model, network_enabled=False).model_dump())
    store.set("agents", [])
    store.set("meetings", {"notes": "", "tasks": []})
    services = Services(store, lambda: memory, LocalLLM)
    if not services.llm.status()["ready"]:
        raise RuntimeError("Start Ollama with the selected installed model.")
    questions = [
        ("single", "How many times does the event queue retry a failed delivery?", ["cedar-runbook.pdf"]),
        ("compound", "What is the incident retry limit, and how long is access approval valid?",
         ["cedar-runbook.pdf", "cedar-approval.docx"]),
    ]
    rows = []
    for repeat in range(3):
        for label, question, sources in questions:
            began = time.perf_counter()
            first = None
            answer = []
            citations = []
            for event in stream_chat(Query(text=question, selected_sources=sources), services):
                if event["type"] == "sources":
                    citations = event["citations"]
                elif event["type"] == "token":
                    if first is None:
                        first = time.perf_counter() - began
                    answer.append(event["text"])
            rows.append({"case": label, "repeat": repeat + 1,
                         "first_token_seconds": round(first, 3) if first is not None else None,
                         "total_seconds": round(time.perf_counter() - began, 3),
                         "citation_sources": [citation["source"] for citation in citations],
                         "answer": "".join(answer), "backend_working_set_mb": backend_working_set_mb()})
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(json.dumps({"model": args.model, "ingestion_seconds": ingestion_seconds,
                                               "rows": rows}, indent=2) + "\n", encoding="utf-8")
            print(f"{label} repeat {repeat + 1}: {rows[-1]['first_token_seconds']}s first token, {rows[-1]['total_seconds']}s total", flush=True)
    summary = {label: {
        "first_observed_total_seconds": next(row["total_seconds"] for row in rows if row["case"] == label),
        "later_median_first_token_seconds": round(statistics.median(
            row["first_token_seconds"] for row in rows if row["case"] == label and row["repeat"] > 1), 3),
        "later_median_total_seconds": round(statistics.median(
            row["total_seconds"] for row in rows if row["case"] == label and row["repeat"] > 1), 3),
    } for label, _, _ in questions}
    result = {"model": args.model, "provider": memory.brain.hardware_mode,
              "ingestion_seconds": ingestion_seconds, "documents": len(corpus["documents"]),
              "first_token_scope": "In-process graph/retrieval/model stream; excludes HTTP and browser.",
              "memory_scope": "Backend process working set after each answer; excludes Ollama process and peak system RAM.",
              "cold_scope": "First observed sample; Ollama may already be warm.",
              "summary": summary, "rows": rows}
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--corpus", type=Path, default=ROOT / "evaluations/second-holdout-corpus.json")
    parser.add_argument("--model", default="llama3:latest")
    parser.add_argument("--output", type=Path, default=ROOT / "evaluations/results/q02-screening.json")
    parser.add_argument("--worker", action="store_true", help=argparse.SUPPRESS)
    parser.add_argument("--data-dir", type=Path, help=argparse.SUPPRESS)
    args = parser.parse_args()
    args.corpus = args.corpus.resolve()
    args.output = args.output.resolve()
    if args.worker:
        worker(args)
    else:
        scratch = ROOT / ".tmp"
        scratch.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="q02-screening-", dir=scratch) as directory:
            subprocess.run([sys.executable, __file__, "--worker", "--corpus", str(args.corpus),
                            "--model", args.model, "--output", str(args.output), "--data-dir", directory], check=True)


if __name__ == "__main__":
    main()
