"""Exercise actual chat/API with real embeddings and Ollama in isolated storage.

Automatic checks are diagnostics, not semantic accuracy judgments.
"""
import argparse
import hashlib
import json
import os
import re
import secrets
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))


def check_answer(case, response, checks):
    answer = response["answer"]
    citations = response["citations"]
    refs = [int(number) for number in re.findall(r"\[(\d+)\]", answer)]
    row = {"citation_numbers_valid": all(1 <= number <= len(citations) for number in refs),
           "manual_semantic_review_required": True}
    patterns = checks.get("answer_patterns")
    if patterns:
        row["expected_facts_present"] = all(re.search(pattern, answer, re.I) for pattern in patterns)
        row["expected_facts_present"] = bool(row["expected_facts_present"])
        expected = checks.get("evidence") or case.get("evidence")
        row["expected_evidence_cited"] = any(
            1 <= number <= len(citations)
            and citations[number-1]["source"] == expected["source"]
            and citations[number-1]["page"] == expected["page"]
            and expected["contains"].lower() in citations[number-1]["text"].lower()
            for number in refs
        )
    if checks.get("expect_abstention"):
        row["abstention_language_present"] = bool(re.search(
            r"couldn.t find|not (?:present|provided|specified|mentioned|available|supported)|no (?:information|evidence|supporting)|does(?:n.t| not).*?(?:provide|contain|mention|specify)|cannot (?:determine|answer)|don.t (?:know|have)|isn.t (?:provided|specified)|not have.*information",
            answer, re.I | re.S))
    allowed = checks.get("expected_scope", case.get("sources"))
    if allowed is not None:
        row["scope_respected"] = all(c["source"] in allowed for c in citations)
    if checks.get("forbidden_patterns"):
        row["forbidden_claims_absent"] = not any(re.search(pattern, answer, re.I) for pattern in checks["forbidden_patterns"])
    return row


def metrics(rows):
    fields = ["expected_facts_present", "expected_evidence_cited", "citation_numbers_valid",
              "scope_respected", "abstention_language_present", "conversation_persisted", "forbidden_claims_absent"]
    result = {}
    for field in fields:
        values = [row[field] for row in rows if field in row]
        result[field] = {"passed": sum(values), "total": len(values), "percent": round(100*sum(values)/len(values), 1) if values else None}
    result["execution"] = {"completed": sum("error" not in row for row in rows), "total": len(rows)}
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", default="llama3:latest")
    parser.add_argument("--corpus", type=Path, default=ROOT / "evaluations/corpus.json")
    parser.add_argument("--checks", type=Path, default=ROOT / "evaluations/answer_checks.json")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--rescore", type=Path, help="Recheck saved answers without model calls; writes a separate artifact.")
    parser.add_argument("--worker", action="store_true", help=argparse.SUPPRESS)
    parser.add_argument("--data-dir", type=Path, help=argparse.SUPPRESS)
    args = parser.parse_args()
    if args.output is None:
        args.output = ROOT / ("evaluations/results/answers-rescored.json" if args.rescore else "evaluations/results/answers-baseline.json")
    if args.rescore:
        if args.output.resolve() == args.rescore.resolve():
            parser.error("Rescoring must preserve the original artifact; choose a different output")
        raw = args.rescore.read_bytes()
        result = json.loads(raw)
        corpus_raw = args.corpus.read_bytes()
        checks_raw = args.checks.read_bytes()
        assert result["corpus_sha256"] == hashlib.sha256(corpus_raw).hexdigest(), "Corpus changed; original run cannot be compared"
        assert result["checks_sha256"] == hashlib.sha256(checks_raw).hexdigest(), "Checks changed; original run cannot be compared"
        cases = {case["id"]: case for case in json.loads(corpus_raw)["cases"]}
        checks = json.loads(checks_raw)
        result["original_metrics"] = result["metrics"]
        for row in result["cases"]:
            if "error" not in row:
                row.update(check_answer(cases[row["id"]], row, checks[row["id"]]))
        result.update(metrics=metrics(result["cases"]), original_artifact_sha256=hashlib.sha256(raw).hexdigest(),
                      rescored_utc=datetime.now(timezone.utc).isoformat(), scorer_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest())
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, indent=2)+"\n", encoding="utf-8")
        print(json.dumps(result["metrics"], indent=2))
        sys.exit(0)
    if not args.worker:
        scratch = ROOT / ".tmp"
        scratch.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="synapse-answer-eval-", dir=scratch) as directory:
            subprocess.run([sys.executable, str(Path(__file__).resolve()), "--worker", "--data-dir", directory,
                            "--model", args.model, "--corpus", str(args.corpus.resolve()), "--checks", str(args.checks.resolve()), "--output", str(args.output.resolve())], check=True)
        sys.exit(0)
    if args.data_dir is None:
        parser.error("Internal worker requires a data directory")
    # Pair only the isolated in-process API; never read/create the user's token.
    token = secrets.token_urlsafe(48)
    os.environ["SYNAPSE_API_TOKEN"] = token
    from fastapi.testclient import TestClient
    from app.main import create_app
    from app.schemas import Settings
    from app.core.storage import Storage
    from app.core.memory import MemoryBank
    from app.core.amd_bridge import AMDBridge
    from app.core.llm import LocalLLM
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    corpus_raw = args.corpus.read_bytes()
    checks_raw = args.checks.read_bytes()
    corpus = json.loads(corpus_raw)
    checks = json.loads(checks_raw)
    assert LocalLLM(args.model).status()["ready"], "Start Ollama and select an installed model."
    brain = AMDBridge()
    memory = MemoryBank(brain=brain, client=chromadb.PersistentClient(path=str(args.data_dir/"vectors"), settings=ChromaSettings(anonymized_telemetry=False)))
    for document in corpus["documents"]:
        memory.ingest_document(document["source"], document["pages"])
    store = Storage(args.data_dir/"metadata.sqlite3")
    store.set("agents", [])
    store.set("meetings", {"notes": "", "tasks": []})
    store.set("settings", Settings(model=args.model, network_enabled=False).model_dump())
    result = {"created_utc": datetime.now(timezone.utc).isoformat(), "model": args.model,
              "provider": brain.hardware_mode, "corpus_sha256": hashlib.sha256(corpus_raw).hexdigest(),
              "checks_sha256": hashlib.sha256(checks_raw).hexdigest(), "threshold": 0.65,
              "corpus_file": args.corpus.name, "checks_file": args.checks.name,
              "timing": "Total in-process API latency; first-token/network transport not measured.",
              "cases": [], "semantic_accuracy_measured": False}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    app = create_app(storage=store, memory_factory=lambda: memory)
    with TestClient(app, headers={"Authorization": "Bearer " + token}) as api:
        for case in corpus["cases"]:
            rules = checks[case["id"]]
            row = {"id": case["id"], "kind": case["kind"], "question": case["query"]}
            conversation = api.post("/conversations").json()["id"]
            body = {"text": case["query"], "conversation_id": conversation,
                    "selected_sources": rules.get("api_sources", case.get("sources", []))}
            if "agent_sources" in rules:
                agent = api.post("/agents", json={"name": "Evaluation scoped agent", "linked_sources": rules["agent_sources"]}).json()
                body["agent_id"] = agent["id"]
            started = time.perf_counter()
            try:
                if case["kind"] == "follow-up":
                    seed = api.post("/ask", json={"text": case["history"][0]["content"], "conversation_id": conversation, "selected_sources": rules.get("seed_sources", body["selected_sources"])})
                    seed.raise_for_status()
                    row["seed_answer"] = seed.json()["answer"]
                    started = time.perf_counter()
                response = api.post("/ask", json=body)
                response.raise_for_status()
                data = response.json()
                row.update(answer=data["answer"], citations=data["citations"], latency_seconds=round(time.perf_counter()-started, 2))
                row.update(check_answer(case, data, rules))
                saved = api.get("/conversations/" + conversation).json()
                row["conversation_persisted"] = len(saved) == (4 if case["kind"] == "follow-up" else 2)
            except Exception as exc:
                row["error"] = str(exc)[:500]
            result["cases"].append(row)
            result["metrics"] = metrics(result["cases"])
            args.output.write_text(json.dumps(result, indent=2)+"\n", encoding="utf-8")
            print("Completed:", case["id"], "error" if "error" in row else str(row["latency_seconds"])+"s", flush=True)
    print(json.dumps(result["metrics"], indent=2), flush=True)
    if any("error" in row for row in result["cases"]):
        sys.exit(1)
