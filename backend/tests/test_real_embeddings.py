"""Real model checks run when explicitly provisioned; CI never downloads assets."""
from pathlib import Path
import socket
import pytest
from app.core.config import DATA_DIR

model_dir = DATA_DIR / "models" / "minilm"
pytestmark = pytest.mark.skipif(not ((model_dir / "model.onnx").exists() or (model_dir / "onnx" / "model.onnx").exists()), reason="Provision the local embedding model to run this check")


def test_real_offline_embeddings_retrieve_document_without_network(tmp_path, monkeypatch):
    def no_network(*args, **kwargs):
        raise AssertionError("Offline embeddings attempted a network request")
    monkeypatch.setattr(socket, "create_connection", no_network)
    from app.core.amd_bridge import AMDBridge
    from app.core.memory import MemoryBank
    import chromadb
    from chromadb.config import Settings
    brain = AMDBridge(model_dir=model_dir)
    assert brain.hardware_mode == "CPU"
    client = chromadb.PersistentClient(path=str(tmp_path / "real-vectors"), settings=Settings(anonymized_telemetry=False))
    memory = MemoryBank(brain=brain, client=client)
    memory.ingest_document("planet.txt", [{"page": 2, "text": "Saturn is a gas giant with a spectacular system of icy rings."}])
    memory.ingest_document("finance.txt", [{"page": 1, "text": "The office quarterly budget is 1000 dollars for equipment."}])
    result = memory.recall("Which planet has rings?")
    assert result
    assert result[0]["source"] == "planet.txt"
    assert result[0]["page"] == 2
    assert len(brain.embed_text("example")) == 384
