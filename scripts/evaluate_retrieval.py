"""Evaluate synthetic retrieval using provisioned embeddings and disposable storage.

No generation, model download, live provider access, or user-vector writes.
"""
import argparse
import hashlib
import json
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))


def evaluate(corpus, memory, max_distance):
    rows = []
    for case in corpus["cases"]:
        if case["kind"] in ("unsupported-in-topic", "follow-up"):
            rows.append({"id": case["id"], "kind": case["kind"], "status": "requires_generation_evaluation"})
            continue
        started = time.perf_counter()
        records = memory.recall(case["query"], source_filters=case.get("sources"), max_distance=max_distance)
        row = {"id": case["id"], "kind": case["kind"], "retrieval_ms": round((time.perf_counter()-started)*1000, 2),
               "retrieved": [{"source": r["source"], "page": r["page"], "distance": r["distance"]} for r in records]}
        if "evidence" in case:
            expected = case["evidence"]
            row["evidence_hit"] = any(r["source"] == expected["source"] and r["page"] == expected["page"] and expected["contains"].lower() in r["text"].lower() for r in records)
            row["top_one_hit"] = bool(records) and records[0]["source"] == expected["source"] and records[0]["page"] == expected["page"] and expected["contains"].lower() in records[0]["text"].lower()
        if "sources" in case:
            row["scope_respected"] = all(r["source"] in case["sources"] for r in records)
        if case["kind"] == "unrelated":
            row["retrieval_empty"] = not records
        rows.append(row)
    def rate(field):
        values = [r[field] for r in rows if field in r]
        return {"passed": sum(values), "total": len(values), "percent": round(100*sum(values)/len(values), 1) if values else None}
    return {"metrics": {field: rate(field) for field in ["evidence_hit", "top_one_hit", "scope_respected", "retrieval_empty"]},
            "cases": rows, "generation_evaluated": False}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--corpus", type=Path, default=ROOT / "evaluations/corpus.json")
    parser.add_argument("--output", type=Path, default=ROOT / "evaluations/results/retrieval-baseline.json")
    parser.add_argument("--max-distance", type=float, default=0.65)
    args = parser.parse_args()
    raw = args.corpus.read_bytes()
    corpus = json.loads(raw)
    from app.core.amd_bridge import AMDBridge
    from app.core.memory import MemoryBank
    import chromadb
    from chromadb.config import Settings
    brain = AMDBridge()
    with tempfile.TemporaryDirectory(prefix="synapse-eval-") as directory:
        client = chromadb.PersistentClient(path=str(Path(directory)/"vectors"), settings=Settings(anonymized_telemetry=False))
        memory = MemoryBank(brain=brain, client=client)
        for document in corpus["documents"]:
            memory.ingest_document(document["source"], document["pages"])
        result = evaluate(corpus, memory, args.max_distance)
    result.update(created_utc=datetime.now(timezone.utc).isoformat(), corpus_version=corpus["version"],
                  corpus_sha256=hashlib.sha256(raw).hexdigest(), provider=brain.hardware_mode, max_distance=args.max_distance,
                  model_manifest=json.loads((Path(brain.tokenizer.name_or_path)/"synapse-model.json").read_text()))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2)+"\n", encoding="utf-8")
    print(json.dumps(result["metrics"], indent=2))
    print("Generation not evaluated; follow-up and related unsupported cases remain pending.")
    print("Result:", args.output)
