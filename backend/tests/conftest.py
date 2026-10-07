import os
os.environ["SYNAPSE_API_TOKEN"] = "test-only-session-token-" + "x" * 48
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["ANONYMIZED_TELEMETRY"] = "False"
import math
import threading
import pytest
from fastapi.testclient import TestClient
from app.main import create_app
from app.core.storage import Storage


class Tokenizer:
    def encode(self, text, **kwargs):
        return text.split()
    def decode(self, tokens, **kwargs):
        return " ".join(tokens)


class Brain:
    tokenizer = Tokenizer()
    hardware_mode = "CPU"
    def embed_text(self, text):
        values = [text.lower().count(w) for w in ("saturn", "budget", "meeting")] + [0.1]
        norm = math.sqrt(sum(v*v for v in values))
        return [v/norm for v in values]


class LLM:
    def __init__(self, **kwargs):
        pass
    def status(self):
        return {"ready": True, "model": "test", "models": ["test"], "error": None}
    def stream_answer(self, context, question, system_prompt=None, history=None):
        yield "Supported answer "
        yield "[1]."


@pytest.fixture
def storage(tmp_path):
    store = Storage(tmp_path / "metadata.sqlite3")
    store.set("agents", [])
    store.set("meetings", {"notes": "", "tasks": []})
    return store


@pytest.fixture
def memory(tmp_path):
    import chromadb
    from chromadb.config import Settings
    from app.core.memory import MemoryBank
    client = chromadb.PersistentClient(path=str(tmp_path / "vectors"), settings=Settings(anonymized_telemetry=False))
    return MemoryBank(brain=Brain(), client=client)


@pytest.fixture
def api(storage, memory):
    app = create_app(storage=storage, memory_factory=lambda: memory, llm_factory=LLM)
    with TestClient(app) as client:
        yield client


@pytest.fixture
def headers():
    return {"Authorization": "Bearer " + os.environ["SYNAPSE_API_TOKEN"]}
