import json
import threading
import time
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
