"""Freeze a new transfer sample before testing the long-document repairs."""
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from app.core.ingester import FileIngester


def main():
    folder = ROOT / "evaluations/transfer-documents"
    corpus_path = ROOT / "evaluations/transfer-documents-corpus.json"
    checks_path = ROOT / "evaluations/transfer-documents-checks.json"
    manifest_path = ROOT / "evaluations/transfer-documents-manifest.json"
    if any(path.exists() for path in (folder, corpus_path, checks_path, manifest_path)):
        raise SystemExit("Preserve the frozen transfer inputs")
    folder.mkdir()
    noise = "\n\n".join(f"Review entry {i}: reviewers label the current worksheet, check the handover signature, and record observations separately from assumptions. The worksheet records the current review cycle and the assigned reviewer. Missing entries are flagged for the next handover." for i in range(1, 36))
    texts = {
        "Willow Dispatch.md": "# Willow Dispatch Guide\n\n" + noise + "\n\nWillow permits at most six retry attempts for a failed dispatch. After retry exhaustion the dispatch enters the dead-letter review box. Farah Chen is the dispatch incident coordinator.\n",
        "Willow Access v2.md": "# Willow Access Policy Version 2\n\nThis policy replaces Version 1 for new approvals.\n\n" + noise + "\n\nA Willow access approval is valid for thirteen minutes and is consumed once. Every later action needs a new approval. An approved export may contain at most 22 MB.\n",
        "Willow Access v1.md": "# Willow Access Policy Version 1\n\nHistorical rule: an access approval remained valid for twenty-four minutes and could be reused before expiry. Version 2 replaces this rule for new approvals.\n"}
    documents = []
    for name, text in texts.items():
        (folder / name).write_text(text, encoding="utf-8", newline="\n")
        documents.append({"source": name, "pages": FileIngester.parse_bytes(name, text.encode())})
    dispatch, policy, old = texts
    cases = [
        {"id": "two-source-limits", "kind": "supported", "query": "What is the failed-dispatch retry limit, and how long is approval valid?", "sources": [dispatch, policy], "evidence": {"source": dispatch, "page": 1, "contains": "six retry attempts"}},
        {"id": "owner-and-export", "kind": "supported", "query": "Who is the dispatch incident coordinator, and what is the maximum approved export size?", "sources": [dispatch, policy], "evidence": {"source": dispatch, "page": 1, "contains": "Farah Chen"}},
        {"id": "tail-destination", "kind": "supported", "query": "Where does a dispatch go after retry exhaustion?", "sources": [dispatch], "evidence": {"source": dispatch, "page": 1, "contains": "dead-letter review box"}},
        {"id": "approval-validity", "kind": "supported", "query": "How long is a current Willow access approval valid?", "sources": [policy], "evidence": {"source": policy, "page": 1, "contains": "thirteen minutes"}},
        {"id": "changed-source-reuse", "kind": "follow-up", "query": "Can it be reused?", "sources": [policy], "history": [{"role": "user", "content": "Under Willow Access Version 1, can an approval be reused?"}], "evidence": {"source": policy, "page": 1, "contains": "consumed once"}},
        {"id": "version-periods", "kind": "supported", "query": "Compare the approval validity periods in Willow Access v1.md and Willow Access v2.md.", "sources": [old, policy], "evidence": {"source": old, "page": 1, "contains": "twenty-four minutes"}},
        {"id": "unknown-price", "kind": "unsupported", "query": "What is the monthly Willow service price?", "sources": [policy]},
        {"id": "excluded-dispatch", "kind": "unsupported", "query": "How many retries are allowed for a failed dispatch?", "sources": [policy]}]
    checks = {
        "two-source-limits": {"answer_patterns": [r"(?:six|6)\s+(?:retry\s+)?(?:attempts|times|retries)", r"(?:thirteen|13)\s+minutes"], "required_citation_sources": [dispatch, policy]},
        "owner-and-export": {"answer_patterns": ["Farah Chen", r"22\s*MB"], "required_citation_sources": [dispatch, policy]},
        "tail-destination": {"answer_patterns": ["dead-letter review box"]},
        "approval-validity": {"answer_patterns": [r"(?:thirteen|13)\s+minutes"]},
        "changed-source-reuse": {"answer_patterns": [r"once|single.use|cannot be reused|can.t be reused|new approval"], "seed_sources": [old], "forbidden_patterns": ["can be reused before", "can be reused until"]},
        "version-periods": {"answer_patterns": [r"(?:twenty.four|24)\s+minutes", r"(?:thirteen|13)\s+minutes"], "required_citation_sources": [old, policy]},
        "unknown-price": {"expect_abstention": True, "forbidden_patterns": [r"\$\s*\d", r"USD\s*\d"]},
        "excluded-dispatch": {"expect_abstention": True, "forbidden_patterns": [r"(?:six|6)\s+(?:retry\s+)?(?:attempts|times|retries)"]}}
    for path, value in ((corpus_path, {"version": 1, "description": "New authored Markdown transfer sample frozen before first run; no independent human acceptance", "documents": documents, "cases": cases}), (checks_path, checks)):
        path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8", newline="\n")
    manifest = {"frozen_before_first_model_run": True, "files_sha256": {str(path.relative_to(ROOT / "evaluations")).replace("\\", "/"): hashlib.sha256(path.read_bytes()).hexdigest() for path in [*folder.iterdir(), corpus_path, checks_path]}}
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
    print("Frozen eight new transfer cases before their first model run")


if __name__ == "__main__":
    main()
