import json
import threading
import time
import pytest
from app.schemas import Query
from app.workflows.chat import ChatTokens, stream_chat


def test_generation_error_does_not_save_partial_turn_or_hold_lock(api, headers, memory, monkeypatch):
    memory.ingest_document("saturn.txt", [{"page": 2, "text": "saturn rings"}])
    services = api.app.state.services
    class BrokenLLM:
        def stream_answer(self, *args):
            yield "partial"
            raise RuntimeError("Model failed")
    monkeypatch.setattr(services, "llm_factory", lambda **kwargs: BrokenLLM())
    identifier = api.post("/conversations", headers=headers).json()["id"]
    body = {"text": "saturn", "conversation_id": identifier}
    response = api.post("/ask/stream", headers=headers, json=body)
    events = [json.loads(line[6:]) for line in response.text.splitlines() if line.startswith("data: ")]
    assert [event["type"] for event in events] == ["sources", "token", "error"]
    assert api.get("/conversations/" + identifier, headers=headers).json() == []
    assert not services.chat_lock.locked()
    assert api.post("/ask", headers=headers, json=body).status_code == 503
    assert not services.chat_lock.locked()


def test_scope_errors_are_http_errors_and_release_lock(api, headers):
    for body, expected in [({"text": "question", "agent_id": 99999}, 404),
                           ({"text": "question", "allow_web": True}, 403)]:
        assert api.post("/ask/stream", headers=headers, json=body).status_code == expected
        assert not api.app.state.services.chat_lock.locked()
    assert api.post("/ask", headers=headers, json={"text": "question"}).status_code == 200


def test_graph_passes_followup_history_and_provenance(api, headers, memory, monkeypatch):
    memory.ingest_document("saturn.txt", [{"page": 7, "text": "saturn rings"}])
    services = api.app.state.services
    identifier = services.storage.new_conversation()["id"]
    services.storage.save_turn(identifier, "Tell me about saturn", "Rings [1].", [])
    captured = {}
    class RecordingLLM:
        def stream_answer(self, context, question, system_prompt=None, history=None):
            captured.update(context=context, history=history)
            yield "Follow-up [1]."
    monkeypatch.setattr(services, "llm_factory", lambda **kwargs: RecordingLLM())
    response = api.post("/ask", headers=headers, json={"text": "What about it?", "conversation_id": identifier}).json()
    assert "saturn.txt (page 7)" in captured["context"]
    assert len(captured["history"]) == 2
    assert response["citations"][0]["page"] == 7


def test_scope_change_excludes_prior_answer_from_model_history(api, headers, memory, monkeypatch):
    memory.ingest_document("old.txt", [{"page": 1, "text": "Old policy allows reuse."}])
    memory.ingest_document("selected.txt", [{"page": 1, "text": "Selected policy is single use."}])
    services = api.app.state.services
    identifier = services.storage.new_conversation()["id"]
    services.storage.save_turn(identifier, "What was the old policy?", "Reuse [1].",
                               [{"source": "old.txt", "page": 1, "text": "Old policy allows reuse."}])
    captured = {}
    class RecordingLLM:
        def stream_answer(self, context, question, system_prompt=None, history=None):
            captured.update(context=context, history=history)
            yield "Single use [1]."
    monkeypatch.setattr(services, "llm_factory", lambda **kwargs: RecordingLLM())
    response = api.post("/ask", headers=headers, json={"text": "What does this policy say?",
                                                      "conversation_id": identifier,
                                                      "selected_sources": ["selected.txt"]})
    assert response.status_code == 200
    assert captured["history"] == []
    assert all(c["source"] == "selected.txt" for c in response.json()["citations"])


def test_closing_graph_stops_generation_and_closes_model_iterator(api, memory, monkeypatch):
    memory.ingest_document("saturn.txt", [{"page": 1, "text": "saturn rings"}])
    services = api.app.state.services
    closed = threading.Event()
    produced = []
    class SlowLLM:
        def stream_answer(self, *args):
            try:
                for i in range(1000):
                    time.sleep(0.005)
                    produced.append(i)
                    yield "token"
            finally:
                closed.set()
    monkeypatch.setattr(services, "llm_factory", lambda **kwargs: SlowLLM())
    events = stream_chat(Query(text="saturn"), services)
    assert next(events)["type"] == "sources"
    tokens = ChatTokens(events)
    assert next(tokens) == "token"
    tokens.close()
    assert closed.wait(1)
    assert len(produced) < 1000


def test_graph_disables_inherited_tracing(api, monkeypatch):
    from langsmith.run_helpers import get_tracing_context
    monkeypatch.setenv("LANGSMITH_TRACING", "true")
    services = api.app.state.services
    observed = []
    original = services.agent
    def agent(identifier):
        observed.append(get_tracing_context()["enabled"])
        return original(identifier)
    monkeypatch.setattr(services, "agent", agent)
    assert list(stream_chat(Query(text="unsupported"), services))[0]["citations"] == []
    assert observed == [False]


def test_compound_answer_retries_missing_citation(api, memory, monkeypatch):
    services = api.app.state.services
    def recall(question, **kwargs):
        if question.startswith("What is retry"):
            return [{"id": "retry", "source": "runbook.pdf", "page": 1, "text": "Retry three times."}]
        if question.startswith("how long"):
            return [{"id": "approval", "source": "approval.docx", "page": 1, "text": "Approval lasts ten minutes."}]
        return []
    monkeypatch.setattr(memory, "recall", recall)
    calls = []
    class LLM:
        def stream_answer(self, context, question, system_prompt=None, history=None):
            calls.append(question)
            yield ("Three retries and ten minutes [1]." if len(calls) == 1 else
                   "Three retries [1]. Approval lasts ten minutes [2].")
    monkeypatch.setattr(services, "llm_factory", lambda **kwargs: LLM())
    events = list(stream_chat(Query(text="What is retry limit, and how long is approval valid?",
                                    selected_sources=["runbook.pdf", "approval.docx"]), services))
    assert len(calls) == 2
    assert "first part needs [1]" in calls[1] and "second part needs [2]" in calls[1]
    assert [event["text"] for event in events if event["type"] == "token"] == [
        "Three retries [1]. Approval lasts ten minutes [2]."]
    assert all("_top_clauses" not in ref for ref in events[0]["citations"])


@pytest.mark.parametrize("bad_answer", ["Three retries and ten minutes [1].", "Three retries [1]. Ten minutes [2] [51]."])
def test_compound_answer_withholds_uncited_retry(api, memory, monkeypatch, bad_answer):
    services = api.app.state.services
    def recall(question, **kwargs):
        if question.startswith("What is retry"):
            return [{"id": "retry", "source": "runbook.pdf", "page": 1, "text": "Retry three times."}]
        if question.startswith("how long"):
            return [{"id": "approval", "source": "approval.docx", "page": 1, "text": "Approval lasts ten minutes."}]
        return []
    monkeypatch.setattr(memory, "recall", recall)
    calls = []
    class LLM:
        def stream_answer(self, context, question, system_prompt=None, history=None):
            calls.append(question)
            yield bad_answer
    monkeypatch.setattr(services, "llm_factory", lambda **kwargs: LLM())
    events = list(stream_chat(Query(text="What is retry limit, and how long is approval valid?",
                                    selected_sources=["runbook.pdf", "approval.docx"]), services))
    assert len(calls) == 2
    assert [event["text"] for event in events if event["type"] == "token"] == [
        "I couldn't produce a fully cited answer from the selected sources. Try asking each part separately."]


@pytest.mark.parametrize("correct_on_retry", [True, False])
def test_numbered_document_never_emits_invalid_section_citations(api, memory, monkeypatch, correct_on_retry):
    services = api.app.state.services
    monkeypatch.setattr(memory, "recall", lambda *args, **kwargs: [
        {"id": "rule", "source": "policy.md", "page": 1, "text": "Section 51\nAn approval can be consumed once."}])
    calls = []
    class LLM:
        def stream_answer(self, context, question, system_prompt=None, history=None):
            calls.append(question)
            yield "Only once [1]." if len(calls) == 2 and correct_on_retry else "Only once [51]."
    monkeypatch.setattr(services, "llm_factory", lambda **kwargs: LLM())
    events = list(stream_chat(Query(text="Can an approval be reused?", selected_sources=["policy.md"]), services))
    assert len(calls) == 2
    text = "".join(event.get("text", "") for event in events if event["type"] == "token")
    assert "[51]" not in text
    assert text == ("Only once [1]." if correct_on_retry else "I couldn't produce an answer with valid evidence references. Try rephrasing the question.")
