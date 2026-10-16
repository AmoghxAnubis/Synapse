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
    assert len(calls) == 2
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


def test_empty_selected_source_query_uses_name_context_without_widening_cutoff():
    calls = []
    class Memory:
        def recall(self, query, **kwargs):
            calls.append((query, kwargs))
            if query.startswith("Operations\n"):
                return [{"id": "tail", "source": "Operations.pdf", "text": "Restore the verified backup before reopening document imports."}]
            return []
    docs = retrieve_documents(Memory(), "What must happen before document imports reopen?", ["Operations.pdf"], 0.65)
    assert docs[0].metadata["id"] == "tail"
    assert all(kwargs["max_distance"] == 0.65 and kwargs["source_filters"] == ["Operations.pdf"] for _, kwargs in calls)


def test_source_name_overlap_alone_cannot_admit_unrelated_hint():
    class Memory:
        def recall(self, query, **kwargs):
            return [{"id": "unrelated", "source": "Harbor.md", "text": "Harbor requires an approval."}] if query.startswith("Harbor\n") else []
    assert retrieve_documents(Memory(), "What is Harbor monthly subscription price?", ["Harbor.md"], 0.65) == []


def test_candidate_ranking_prefers_fact_over_shared_title():
    class Memory:
        def recall(self, query, **kwargs):
            return [{"id": "title", "source": "policy.md", "text": "Approval policy version two. Review each register."},
                    {"id": "fact", "source": "policy.md", "text": "Approval policy version two: approval is valid for nine minutes."}]
    docs = retrieve_documents(Memory(), "How long is approval valid under policy version two?", ["policy.md"], 0.65)
    assert docs[0].metadata["id"] == "fact"


def test_narrow_queries_drop_boilerplate_but_broad_requests_keep_alternatives():
    class Memory:
        def recall(self, query, **kwargs):
            return [{"id": "fact", "source": "policy.md", "text": "Archive purges require a 36-hour audit review window."},
                    {"id": "filler", "source": "policy.md", "text": "Review the inventory and identify each bundle."}]
    narrow = retrieve_documents(Memory(), "What audit window applies to archive purges?", ["policy.md"], 0.65)
    assert [doc.metadata["id"] for doc in narrow] == ["fact"]
    broad = retrieve_documents(Memory(), "Summarize the archive rules and inventory review.", ["policy.md"], 0.65)
    assert {doc.metadata["id"] for doc in broad} == {"fact", "filler"}
