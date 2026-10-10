from app.ai.retriever import retrieve_documents


def test_compound_question_balances_scoped_evidence_without_relaxing_threshold():
    calls = []

    class Memory:
        def recall(self, query, **kwargs):
            calls.append((query, kwargs))
            if query.startswith("What latency"):
                return [{"id": "baseline", "source": "baseline.md", "text": "First-token latency", "page": 1}]
            if query.startswith("what concurrency"):
                return [{"id": "handover", "source": "handover.md", "text": "One answer at a time", "page": 2}]
            return [{"id": "baseline", "source": "baseline.md", "text": "First-token latency", "page": 1}]

    documents = retrieve_documents(
        Memory(), "What latency was requested, and what concurrency limit applies?",
        ["baseline.md", "handover.md"], 0.65,
    )
    assert [doc.metadata["source"] for doc in documents] == ["baseline.md", "handover.md"]
    assert len(calls) == 3
    assert all(kwargs["source_filters"] == ["baseline.md", "handover.md"] and
               kwargs["max_distance"] == 0.65 for _, kwargs in calls)


def test_explicit_document_names_allow_bounded_source_retrieval():
    calls = []

    class Memory:
        def recall(self, query, **kwargs):
            calls.append((query, kwargs))
            if kwargs["source_filters"] == ["DEVELOPER_HANDOVER.md"]:
                return [{"id": "handover", "source": "DEVELOPER_HANDOVER.md", "text": "One answer at a time"}]
            return []

    documents = retrieve_documents(
        Memory(),
        "What latency did the baseline review request, and what concurrency limit does the developer handover describe?",
        ["BASELINE_REVIEW.md", "DEVELOPER_HANDOVER.md"], 0.65,
    )
    assert [doc.metadata["source"] for doc in documents] == ["DEVELOPER_HANDOVER.md"]
    assert calls[0][1]["source_filters"] == ["BASELINE_REVIEW.md"]
    assert calls[1][1]["source_filters"] == ["DEVELOPER_HANDOVER.md"]
    assert calls[1][1]["max_distance"] == 0.85


def test_empty_compound_clause_gets_only_one_bounded_candidate():
    calls = []

    class Memory:
        def recall(self, query, **kwargs):
            calls.append((query, kwargs))
            if query.startswith("What is the incident") and kwargs["max_distance"] == 0.70:
                return [{"id": "runbook", "source": "runbook.pdf", "text": "Three retries"}]
            if query.startswith("how long"):
                return [{"id": "approval", "source": "approval.docx", "text": "Ten minutes"}]
            return []

    documents = retrieve_documents(
        Memory(), "What is the incident retry limit, and how long is approval valid?",
        ["runbook.pdf", "approval.docx"], 0.65,
    )
    assert [doc.metadata["source"] for doc in documents] == ["runbook.pdf", "approval.docx"]
    fallback = [kwargs for query, kwargs in calls if query.startswith("What is the incident") and
                kwargs["max_distance"] == 0.70]
    assert len(fallback) == 1 and fallback[0]["n_results"] == 1
