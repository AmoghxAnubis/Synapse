import runpy
from app.core.config import BACKEND_DIR

module = runpy.run_path(str(BACKEND_DIR.parent / "scripts/evaluate_answers.py"))
check_answer = module["check_answer"]
metrics = module["metrics"]


def test_wrong_citation_and_invalid_reference_cannot_pass():
    case = {"evidence": {"source": "release.txt", "page": 2, "contains": "two percent"}}
    response = {"answer": "Rollback at two percent [1] [99].", "citations": [
        {"source": "release.txt", "page": 1, "text": "Budget is 12500"}
    ]}
    result = check_answer(case, response, {"answer_patterns": ["two percent"]})
    assert result["expected_facts_present"]
    assert not result["expected_evidence_cited"]
    assert not result["citation_numbers_valid"]
    assert result["manual_semantic_review_required"]


def test_abstention_wording_is_not_a_semantic_accuracy_claim():
    result = check_answer({}, {"answer": "No information is provided. A refund is guaranteed.", "citations": []}, {"expect_abstention": True})
    assert result["abstention_language_present"]
    assert result["manual_semantic_review_required"]
    summary = metrics([{"error": "Model unavailable"}, {"scope_respected": False}])
    assert summary["execution"] == {"completed": 1, "total": 2}
    assert summary["scope_respected"]["percent"] == 0
