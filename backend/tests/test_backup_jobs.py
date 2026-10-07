import json
import time
import zipfile
import pytest
from app.core.jobs import JobManager


def test_background_jobs_report_failure_and_cancel(storage):
    jobs = JobManager(storage)
    try:
        failed = jobs.submit(lambda event: (_ for _ in ()).throw(ValueError("Import failed")))
        for _ in range(100):
            result = jobs.get(failed["id"])
            if result["status"] == "failed":
                break
            time.sleep(0.01)
        assert result["status"] == "failed"
        assert result["error"] == "Import failed"
        def waiting(event):
            event.wait(1)
            if event.is_set():
                raise InterruptedError()
            return {"ok": True}
        cancelled = jobs.submit(waiting)
        assert jobs.cancel(cancelled["id"])
        for _ in range(100):
            result = jobs.get(cancelled["id"])
            if result["status"] == "cancelled":
                break
            time.sleep(0.01)
        assert result["status"] == "cancelled"
    finally:
        jobs.close()


def test_metadata_and_vectors_backup_restore(tmp_path, storage, monkeypatch):
    import app.backup as backup
    import chromadb
    from chromadb.config import Settings
    monkeypatch.setattr(backup, "DATA_DIR", tmp_path)
    monkeypatch.setattr(backup, "prepare_data_dir", lambda: tmp_path)
    monkeypatch.setattr(backup, "Storage", lambda: storage)
    storage.set("meetings", {"notes": "Preserve this note", "tasks": []})
    storage.set("integration:github", {"connected": True, "resources": ["a/b"]})
    client = chromadb.PersistentClient(path=str(tmp_path / "vectors"), settings=Settings(anonymized_telemetry=False))
    collection = client.get_or_create_collection("synapse_v1", metadata={"hnsw:space": "cosine"})
    collection.add(ids=["document:0"], documents=["Private document"], metadatas=[{"source": "notes.txt"}], embeddings=[[1.0] + [0.0]*383])
    archive = backup.create_backup(tmp_path / "backup.zip")
    restored = backup.restore_backup(archive, tmp_path / "restored")
    from app.core.storage import Storage
    restored_store = Storage(restored / "metadata.sqlite3")
    assert restored_store.get("meetings")["notes"] == "Preserve this note"
    assert restored_store.get("integration:github") is None
    restored_client = chromadb.PersistentClient(path=str(restored / "vectors"), settings=Settings(anonymized_telemetry=False))
    assert restored_client.get_collection("synapse_v1").get()["documents"] == ["Private document"]
    with pytest.raises(ValueError): backup.restore_backup(archive, restored)


def test_restore_rejects_zip_paths_and_oversized_backups(tmp_path):
    from app.backup import restore_backup
    archive = tmp_path / "bad.zip"
    with zipfile.ZipFile(archive, "w") as z:
        z.writestr("../outside", "bad")
    with pytest.raises(ValueError): restore_backup(archive, tmp_path / "restored")
    assert not (tmp_path / "restored").exists()
