from concurrent.futures import ThreadPoolExecutor
from app.core.agent_store import AgentStore
from app.core.ingester import FileIngester


def test_reimport_does_not_duplicate_and_replaces_stale_chunks(memory):
    first = memory.ingest_document("report.txt", [{"page": 1, "text": "saturn " * 500}])
    assert first["chunks_processed"] > 1
    assert memory.ingest_document("report.txt", [{"page": 1, "text": "saturn " * 500}])["unchanged"]
    assert memory.collection.count() == first["chunks_processed"]
    memory.ingest_document("report.txt", [{"page": 2, "text": "budget"}])
    assert memory.collection.count() == 1
    assert memory.source_chunks("report.txt")[0]["page"] == 2


def test_source_filter_and_relevance(memory):
    memory.ingest_document("saturn.txt", [{"page": 2, "text": "saturn rings"}])
    memory.ingest_document("budget.txt", [{"page": 1, "text": "budget 100 dollars"}])
    assert memory.recall("saturn", source_filters=["budget.txt"]) == []
    assert memory.recall("saturn", source_filters=[]) == []
    citations = memory.recall("saturn")
    assert len(citations) == 1
    assert citations[0]["source"] == "saturn.txt"
    assert citations[0]["page"] == 2


def test_tail_and_overlap_are_preserved():
    words = [str(i) for i in range(700)]
    chunks = FileIngester.chunk_text(" ".join(words), chunk_size=200, overlap=40)
    assert "699" in chunks[-1]
    assert chunks[0].split()[-40:] == chunks[1].split()[:40]


def test_unsupported_and_empty_files_are_rejected():
    import pytest
    with pytest.raises(ValueError): FileIngester.parse_bytes("bad.exe", b"payload")
    with pytest.raises(ValueError): FileIngester.parse_bytes("empty.txt", b" ")


def test_normal_questions_do_not_route_to_github(api, headers, memory):
    memory.ingest_document("saturn.txt", [{"page": 1, "text": "saturn project requirements"}])
    result = api.post("/ask", headers=headers, json={"text": "Summarize saturn project requirements"})
    assert result.status_code == 200
    assert result.json()["answer"] == "Supported answer [1]."
    assert result.json()["citations"][0]["source"] == "saturn.txt"


def test_no_evidence_does_not_generate_unsupported_answer(api, headers):
    answer = api.post("/ask", headers=headers, json={"text": "What is my budget?"}).json()
    assert "couldn't find" in answer["answer"]
    assert answer["citations"] == []


def test_conversation_persists_and_streams(api, headers, memory, storage):
    memory.ingest_document("saturn.txt", [{"page": 1, "text": "saturn has rings"}])
    identifier = api.post("/conversations", headers=headers).json()["id"]
    response = api.post("/ask/stream", headers=headers, json={"text": "Tell me about saturn", "conversation_id": identifier})
    assert response.status_code == 200
    assert '"type": "token"' in response.text
    assert '"type": "done"' in response.text
    saved = api.get("/conversations/" + identifier, headers=headers).json()
    assert len(saved) == 2
    assert saved[1]["content"] == "Supported answer [1]."
    assert saved[1]["citations"][0]["source"] == "saturn.txt"
    assert api.delete("/conversations/" + identifier, headers=headers).status_code == 200
    assert api.get("/conversations/" + identifier, headers=headers).status_code == 404


def test_agent_and_user_source_restrictions_intersect(api, headers, memory):
    memory.ingest_document("saturn.txt", [{"page": 1, "text": "saturn rings"}])
    api.patch("/agents/3", headers=headers, json={"linked_sources": ["saturn.txt"]})
    answer = api.post("/ask", headers=headers, json={"text": "saturn", "agent_id": 3, "selected_sources": ["other.txt"]}).json()
    assert answer["citations"] == []


def test_concurrent_agent_ids_are_unique(storage):
    store = AgentStore(storage)
    with ThreadPoolExecutor(max_workers=6) as executor:
        records = list(executor.map(lambda i: store.add_agent({"name": str(i)}), range(20)))
    assert len({r["id"] for r in records}) == 20


def test_meetings_roundtrip(api, headers):
    data = {"notes": "Meeting budget", "tasks": [{"id": 1, "text": "Follow up", "completed": False}]}
    assert api.post("/meetings", headers=headers, json=data).status_code == 200
    assert api.get("/meetings", headers=headers).json() == data



def test_referential_follow_up_keeps_previous_topic(api, headers, memory, storage, monkeypatch):
    identifier = api.post("/conversations", headers=headers).json()["id"]
    storage.save_turn(identifier, "Who operates Nimbus recovery?", "Leela [1].", [])
    recalled = []
    monkeypatch.setattr(memory, "recall", lambda query, **kwargs: recalled.append(query) or [])
    response = api.post("/ask", headers=headers, json={"text": "What is its retry limit?", "conversation_id": identifier})
    assert response.status_code == 200
    assert recalled == ["What is its retry limit?\nWho operates Nimbus recovery?"]


def test_new_topic_does_not_retrieve_previous_question(api, headers, memory, storage, monkeypatch):
    identifier = api.post("/conversations", headers=headers).json()["id"]
    storage.save_turn(identifier, "What is the Borealis release budget?", "12500 [1].", [])
    recalled = []
    monkeypatch.setattr(memory, "recall", lambda query, **kwargs: recalled.append(query) or [])
    response = api.post("/ask", headers=headers, json={"text": "How long are Helios EU tickets retained?", "conversation_id": identifier})
    assert response.status_code == 200
    assert recalled == ["How long are Helios EU tickets retained?"]



def test_reimport_refreshes_legacy_chunk_format_without_duplicates(memory):
    pages = [{"page": 1, "text": "saturn rings"}]
    memory.ingest_document("legacy.txt", pages)
    old = memory.collection.get(include=["metadatas"])
    metadata = dict(old["metadatas"][0])
    metadata.pop("chunk_format")
    # Updating metadata merges fields; delete/reinsert to simulate an old record.
    memory.collection.delete(ids=old["ids"])
    memory.collection.upsert(ids=old["ids"], documents=["saturn rings"], embeddings=[memory.brain.embed_text("saturn rings")], metadatas=[metadata])
    refreshed = memory.ingest_document("legacy.txt", pages)
    assert not refreshed["unchanged"]
    assert memory.collection.count() == 1
    assert memory.source_chunks("legacy.txt")[0]["chunk_format"] == 2
    assert memory.ingest_document("legacy.txt", pages)["unchanged"]
