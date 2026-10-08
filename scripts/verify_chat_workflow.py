"""Check the LangGraph API and real Ollama using synthetic retrieval.

This does not evaluate ONNX retrieval or general answer quality. Citation
presence is reported as a diagnostic, not hidden behind a successful exit.
All application data is temporary; the installed model is left unchanged.
"""
import argparse
import json
import os
from pathlib import Path
import sys
import tempfile
import time


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", default="llama3.2:3b")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(root / "backend"))
    scratch = root / ".tmp"
    scratch.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(dir=scratch, prefix="langgraph-smoke-") as directory:
        os.environ["SYNAPSE_DATA_DIR"] = directory
        os.environ["SYNAPSE_API_TOKEN"] = "isolated-langgraph-smoke-" + "x" * 48
        from fastapi.testclient import TestClient
        from app.main import create_app
        from app.core.storage import Storage
        from app.schemas import Settings

        class Memory:
            brain = type("Brain", (), {"hardware_mode": "Synthetic retrieval fixture"})()

            def recall(self, query_text, source_filters=None, max_distance=0.65):
                if source_filters == []:
                    return []
                return [{"id": "synthetic:0", "source": "synthetic-budget.txt", "page": 2, "chunk": 1,
                         "url": "", "distance": 0.1,
                         "text": "The Saturn project has an approved budget of 4200 USD."}]

        storage = Storage(Path(directory) / "metadata.sqlite3")
        storage.set("settings", Settings(model=args.model).model_dump())
        storage.set("agents", [])
        storage.set("meetings", {"notes": "", "tasks": []})
        app = create_app(storage=storage, memory_factory=Memory)
        with TestClient(app, headers={"Authorization": "Bearer " + os.environ["SYNAPSE_API_TOKEN"]}) as api:
            if not app.state.services.llm.status()["ready"]:
                raise RuntimeError("Start Ollama and select an installed model with --model.")
            conversation = api.post("/conversations").json()["id"]
            started = time.perf_counter()
            response = api.post("/ask/stream", json={"text": "What is the approved Saturn project budget?",
                                                    "conversation_id": conversation})
            response.raise_for_status()
            events = [json.loads(line[6:]) for line in response.text.splitlines() if line.startswith("data: ")]
            answer = "".join(e["text"] for e in events if e["type"] == "token")
            assert events[0]["type"] == "sources" and events[-1]["type"] == "done", events
            assert events[0]["citations"][0]["page"] == 2
            assert "4200" in answer or "4,200" in answer, answer
            assert len(api.get("/conversations/" + conversation).json()) == 2
            print(json.dumps({"stream_answer": answer, "citation_present": "[1]" in answer,
                              "latency_seconds": round(time.perf_counter()-started, 2),
                              "persisted_turn": True, "retrieval": "synthetic fixture; ONNX not exercised"}), flush=True)
            followup = api.post("/ask", json={"text": "What currency is that in?", "conversation_id": conversation})
            followup.raise_for_status()
            answer = followup.json()["answer"]
            assert "USD" in answer or "US dollar" in answer, answer
            assert len(api.get("/conversations/" + conversation).json()) == 4
            print(json.dumps({"followup_answer": answer, "citation_present": "[1]" in answer,
                              "persisted_followup": True}), flush=True)
            # Quality diagnostics are separate from API/plumbing checks above.
            if any("[1]" not in text for text in ("".join(e["text"] for e in events if e["type"] == "token"), answer)):
                print("Citation diagnostic failed: investigate under Q01.", file=sys.stderr)
                return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
