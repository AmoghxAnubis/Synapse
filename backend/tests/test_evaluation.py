import json
import pytest
import runpy
from app.core.config import BACKEND_DIR

ROOT = BACKEND_DIR.parent
evaluate = runpy.run_path(str(ROOT / "scripts/evaluate_retrieval.py"))["evaluate"]


@pytest.mark.parametrize("filename", ["corpus.json", "harder-corpus.json"])
def test_corpus_labels_point_to_actual_evidence(filename):
    corpus = json.loads((ROOT / "evaluations" / filename).read_text())
    documents = {document["source"]: document for document in corpus["documents"]}
    assert len(documents) == len(corpus["documents"])
    assert len({case["id"] for case in corpus["cases"]}) == len(corpus["cases"])
    for case in corpus["cases"]:
        if "sources" in case:
            assert all(source in documents for source in case["sources"])
        if "evidence" in case:
            expected = case["evidence"]
            pages = documents[expected["source"]]["pages"]
            assert any(page["page"] == expected["page"] and expected["contains"].lower() in page["text"].lower() for page in pages)


def test_retrieval_metrics_do_not_count_skipped_generation_cases():
    class Memory:
        calls = []
        def recall(self, query, **kwargs):
            self.calls.append(query)
            return [{"source": "allowed.txt", "page": 1, "text": "Budget is 1000", "distance": 0.1}]
    memory = Memory()
    corpus = {"cases": [
        {"id": "hit", "kind": "supported", "query": "budget", "evidence": {"source": "allowed.txt", "page": 1, "contains": "1000"}},
        {"id": "leak", "kind": "scope-only", "query": "restricted", "sources": []},
        {"id": "missing", "kind": "unsupported-in-topic", "query": "revenue"},
        {"id": "follow", "kind": "follow-up", "query": "who owns it"},
    ]}
    result = evaluate(corpus, memory, 0.65)
    assert result["metrics"]["evidence_hit"] == {"passed": 1, "total": 1, "percent": 100.0}
    assert result["metrics"]["scope_respected"]["percent"] == 0
    assert memory.calls == ["budget", "restricted"]
    assert not result["generation_evaluated"]
    assert sum(case.get("status") == "requires_generation_evaluation" for case in result["cases"]) == 2
