"""First-use failures must leave setup, history and source administration usable."""
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import threading

import pytest
from fastapi.testclient import TestClient
from app.core.llm import LocalLLM
from app.core.memory import MemoryBank
from app.main import create_app
from app.schemas import Settings
from conftest import LLM


@pytest.mark.parametrize("payload", [b"not json", b"[]", b'{"models": null}', b'{"models": [{"other": "bad"}]}'])
def test_invalid_ollama_status_is_reported_without_breaking_setup(payload):
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.end_headers()
            self.wfile.write(payload)
        def log_message(self, *args):
            pass
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    worker = threading.Thread(target=server.serve_forever, daemon=True)
    worker.start()
    llm = LocalLLM("test", f"http://127.0.0.1:{server.server_port}")
    try:
        status = llm.status()
        assert status["ready"] is False
        assert status["state"] == "invalid_response"
        assert status["error"]
    finally:
        llm.session.close()
        server.shutdown()
        server.server_close()
        worker.join()


def test_status_does_not_follow_redirects_and_records_selected_digest(monkeypatch):
    llm = LocalLLM("llama3")
    observed = []
    def get(url, **kwargs):
        observed.append(kwargs)
        import requests
        response = requests.Response()
        response.status_code = 302 if len(observed) == 1 else 200
        response.headers["Location"] = "https://example.com"
        response._content = json.dumps({"models": [{"name": "llama3:latest", "digest": "test-digest"}]}).encode()
        return response
    monkeypatch.setattr(llm.session, "get", get)
    try:
        assert llm.status()["state"] == "unavailable"
        assert observed[0]["allow_redirects"] is False
        status = llm.status()
        assert status["ready"]
        assert status["resolved_model"] == "llama3:latest"
        assert status["model_digest"] == "test-digest"
    finally:
        llm.session.close()


def test_missing_embeddings_leave_sources_and_metadata_available(storage, memory, headers, monkeypatch, tmp_path):
    memory.ingest_document("kept.md", [{"page": 1, "text": "saturn rings"}])
    # Reopen the real vector store without supplying a working embedding model.
    monkeypatch.setenv("SYNAPSE_EMBEDDING_DIR", str(tmp_path / "missing-model"))
    reopened = MemoryBank(client=memory.client)
    app = create_app(storage=storage, memory_factory=lambda: reopened, llm_factory=LLM)
    with TestClient(app) as client:
        settings = client.get("/settings", headers=headers)
        assert settings.status_code == 200
        assert settings.json()["embeddings"]["state"] == "missing"
        assert client.get("/sources", headers=headers).json()[0]["name"] == "kept.md"
        assert client.get("/source", headers=headers, params={"name": "kept.md"}).json()[0]["text"] == "saturn rings"
        assert client.get("/agents", headers=headers).status_code == 200
        assert client.post("/conversations", headers=headers).status_code == 201
        readiness = client.get("/health/ready", headers=headers)
        assert readiness.status_code == 503
        assert readiness.json()["llm"]["ready"] is True
        assert readiness.json()["embeddings"]["ready"] is False
        assert readiness.json()["embeddings"]["error"]
        assert client.get("/", headers=headers).status_code == 200
        assert client.delete("/source", headers=headers, params={"name": "kept.md"}).status_code == 200
        assert client.get("/sources", headers=headers).json() == []


def test_model_readiness_is_independent_and_can_recover(storage, memory, headers, monkeypatch, tmp_path):
    model_dir = tmp_path / "model"
    model_dir.mkdir()
    (model_dir / "model.onnx").touch()
    monkeypatch.setenv("SYNAPSE_EMBEDDING_DIR", str(model_dir))
    class MissingLLM(LLM):
        def status(self):
            return {"ready": False, "model": "absent", "models": [], "error": "Pull the selected model."}
    attempts = []
    real_brain = memory.brain
    memory._brain = None
    def load():
        attempts.append(True)
        if len(attempts) == 1:
            raise RuntimeError("Embedding initialization failed")
        return real_brain
    monkeypatch.setattr(memory, "_load_brain", load)
    with TestClient(create_app(storage=storage, memory_factory=lambda: memory, llm_factory=MissingLLM)) as client:
        # Settings must be lightweight; only an explicit check loads embeddings.
        assert client.get("/settings", headers=headers).status_code == 200
        assert attempts == []
        first = client.get("/health/ready", headers=headers)
        assert first.status_code == 503
        assert first.json()["embeddings"]["state"] == "error"
        second = client.get("/health/ready", headers=headers)
        assert second.status_code == 503  # Embeddings recovered, generation still missing.
        assert second.json()["embeddings"]["ready"] is True
        assert second.json()["llm"]["ready"] is False
        assert len(attempts) == 2


def test_provisioning_uses_the_same_custom_directory_as_runtime(tmp_path, monkeypatch):
    from app import provision
    from app.core.model_setup import embedding_directory
    directory = tmp_path / "custom-model"
    monkeypatch.setenv("SYNAPSE_EMBEDDING_DIR", str(directory))
    monkeypatch.setattr(provision, "prepare_data_dir", lambda: None)
    class API:
        def model_info(self, repo):
            return type("Info", (), {"sha": "test-revision"})()
    monkeypatch.setattr(provision, "HfApi", API)
    calls = []
    def download(**kwargs):
        calls.append(kwargs)
        directory.mkdir()
    monkeypatch.setattr(provision, "snapshot_download", download)
    provision.main()
    assert calls[0]["local_dir"] == embedding_directory() == directory
    assert calls[0]["revision"] == "test-revision"
    assert json.loads((directory / "synapse-model.json").read_text())["revision"] == "test-revision"


def test_missing_saved_generation_model_is_not_silently_replaced(storage, memory, headers, monkeypatch):
    import requests
    storage.set("settings", Settings(model="saved-but-missing").model_dump())
    response = requests.Response()
    response.status_code = 200
    response._content = b'{"models": [{"name": "installed:latest", "digest": "installed-digest"}]}'
    monkeypatch.setattr(requests.Session, "get", lambda *args, **kwargs: response)
    with TestClient(create_app(storage=storage, memory_factory=lambda: memory)) as client:
        before = storage.get("settings")
        settings = client.get("/settings", headers=headers).json()
        assert settings["model"] == "saved-but-missing"
        assert settings["llm"]["state"] == "missing_model"
        assert settings["llm"]["models"] == ["installed:latest"]
        check = client.get("/health/ready", headers=headers)
        assert check.status_code == 503
        assert check.json()["embeddings"]["ready"] is True
        assert storage.get("settings") == before
