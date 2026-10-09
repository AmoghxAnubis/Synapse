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


def test_valid_abstention_variation_is_recognized():
    result = check_answer({}, {"answer": "I cannot provide information that is not present in the evidence.", "citations": []}, {"expect_abstention": True})
    assert result["abstention_language_present"]
    assert result["manual_semantic_review_required"]



def test_not_published_abstention_is_recognized():
    result = check_answer({}, {"answer": "The budget amount is not published.", "citations": []}, {"expect_abstention": True})
    assert result["abstention_language_present"]


def test_not_stated_abstention_is_recognized():
    result = check_answer({}, {"answer": "The requested revenue information is not stated in the selected evidence.",
                               "citations": []}, {"expect_abstention": True})
    assert result["abstention_language_present"]


def test_incorrect_version_widening_fails_diagnostic():
    checks = {"forbidden_patterns": [r"3\.\s*12\s*(?:\*\*)?\s*(?:or\s+(?:newer|later)|and\s+(?:newer|later)|\+)"]}
    wrong = check_answer({}, {"answer": "Python 3.12 or newer [1].", "citations": [{}]}, checks)
    right = check_answer({}, {"answer": "Python 3.12 and Node 22.13 or newer [1].", "citations": [{}]}, checks)
    assert not wrong["forbidden_claims_absent"]
    assert right["forbidden_claims_absent"]
    assert right["manual_semantic_review_required"]


def test_quality_checks_flag_known_contradiction_and_uncited_side_facts():
    import json
    checks = json.loads((BACKEND_DIR.parent / "evaluations/answer_checks_quality.json").read_text())
    approval = check_answer({"evidence": {"source": "security.md", "page": 1, "contains": "only once"}},
                            {"answer": "Approval is single-use [1], but reuse is undocumented.",
                                 "citations": [{"source": "security.md", "page": 1, "text": "Approval can be used only once."}]},
                            checks["approval"])
    revenue = check_answer({}, {"answer": "Revenue is not provided. The launch budget is 12500 rupees.",
                                "citations": [{"source": "release.txt", "page": 1, "text": "Budget is 12500 rupees."}]},
                           checks["missing-revenue"])
    clean = check_answer({}, {"answer": "The selected evidence does not provide last year's revenue.",
                              "citations": []}, checks["missing-revenue"])
    assert not approval["forbidden_claims_absent"]
    assert not revenue["forbidden_claims_absent"]
    assert clean["forbidden_claims_absent"]
    assert clean["abstention_language_present"]


def test_two_source_answer_requires_both_sources_to_be_cited():
    case = {}
    citations = [{"source": "orion.txt", "page": 1, "text": "Orion owner is Leena."},
                 {"source": "lyra.txt", "page": 1, "text": "Lyra EU retention is 14 days."}]
    checks = {"required_citation_sources": ["orion.txt", "lyra.txt"]}
    one = check_answer(case, {"answer": "Leena owns Orion; Lyra EU retains tickets for 14 days [1].",
                              "citations": citations}, checks)
    both = check_answer(case, {"answer": "Leena owns Orion [1]; Lyra EU retains tickets for 14 days [2].",
                               "citations": citations}, checks)
    assert not one["required_citation_sources_cited"]
    assert both["required_citation_sources_cited"]


def test_unseen_checks_reject_opposite_policy_and_unmapped_regions():
    import json
    checks = json.loads((BACKEND_DIR.parent / "evaluations/unseen-checks.json").read_text())
    case = {"evidence": {"source": "nova-policy-v1.txt", "page": 1, "contains": "could be reused"}}
    citations = [{"source": "nova-policy-v1.txt", "page": 1, "text": "An approval could be reused."}]
    wrong = check_answer(case, {"answer": "According to version 1, an approval cannot be reused [1].",
                                "citations": citations}, checks["changed-source"])
    assert not wrong["expected_facts_present"]
    assert not wrong["forbidden_claims_absent"]
    ambiguous = check_answer({"evidence": {"source": "lyra-eu.txt", "page": 1, "contains": "14 days"}},
                             {"answer": "The retention period is 14 days [1] or 60 days [2].",
                              "citations": [{"source": "lyra-eu.txt", "page": 1, "text": "14 days"},
                                            {"source": "lyra-us.txt", "page": 1, "text": "60 days"}]},
                             checks["ambiguous-region"])
    assert not ambiguous["expected_facts_present"]
    assert ambiguous["required_citation_sources_cited"]



def test_explicit_rescore_preserves_original_and_verifies_original_checks(tmp_path):
    import hashlib
    import json
    import subprocess
    import sys
    corpus = tmp_path / "corpus.json"
    original_checks = tmp_path / "checks-original.json"
    updated_checks = tmp_path / "checks-updated.json"
    original = tmp_path / "run.json"
    output = tmp_path / "rescored.json"
    corpus.write_text(json.dumps({"cases": [{"id": "sample", "evidence": {"source": "note", "page": 1, "contains": "third"}}]}))
    original_checks.write_text(json.dumps({"sample": {"answer_patterns": ["three"]}}))
    updated_checks.write_text(json.dumps({"sample": {"answer_patterns": ["third"]}}))
    row = {"id": "sample", "answer": "After the third attempt [1].", "citations": [{"source": "note", "page": 1, "text": "After the third attempt"}]}
    row.update(check_answer(json.loads(corpus.read_text())["cases"][0], row, json.loads(original_checks.read_text())["sample"]))
    original.write_text(json.dumps({"corpus_sha256": hashlib.sha256(corpus.read_bytes()).hexdigest(), "checks_sha256": hashlib.sha256(original_checks.read_bytes()).hexdigest(), "cases": [row], "metrics": metrics([row])}))
    before = original.read_bytes()
    command = [sys.executable, str(BACKEND_DIR.parent / "scripts/evaluate_answers.py"), "--rescore", str(original), "--corpus", str(corpus), "--checks", str(original_checks), "--updated-checks", str(updated_checks), "--output", str(output)]
    success = subprocess.run(command, capture_output=True, text=True)
    assert success.returncode == 0, success.stderr
    result = json.loads(output.read_text())
    assert result["metrics"]["expected_facts_present"]["passed"] == 1
    assert result["original_metrics"]["expected_facts_present"]["passed"] == 0
    assert result["checks_explicitly_updated"]
    assert result["original_artifact_sha256"] == hashlib.sha256(before).hexdigest()
    assert original.read_bytes() == before
    original_checks.write_text("{}")
    rejected = subprocess.run(command, capture_output=True, text=True)
    assert rejected.returncode != 0
    assert "Checks changed" in rejected.stderr
    assert original.read_bytes() == before
