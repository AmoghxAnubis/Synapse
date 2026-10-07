"""Create or restore portable local backups while the backend is stopped."""
import argparse
import json
import shutil
import sqlite3
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from .core.config import DATA_DIR, prepare_data_dir
from .core.storage import Storage

LIMIT = 200 * 1024 * 1024


def create_backup(output):
    prepare_data_dir()
    output = Path(output).resolve()
    with TemporaryDirectory(dir=DATA_DIR) as temp:
        metadata = Path(temp) / "metadata.sqlite3"
        store = Storage()
        store.backup(metadata)
        import chromadb
        from chromadb.config import Settings
        client = chromadb.PersistentClient(path=str(DATA_DIR / "vectors"), settings=Settings(anonymized_telemetry=False))
        try:
            collection = client.get_collection("synapse_v1")
            vectors = collection.get(include=["documents", "metadatas", "embeddings"])
            if vectors.get("embeddings") is not None:
                vectors["embeddings"] = vectors["embeddings"].tolist()
        except Exception:
            if "synapse_v1" in [c.name for c in client.list_collections()]:
                raise
            vectors = {"ids": [], "documents": [], "metadatas": [], "embeddings": []}
        with zipfile.ZipFile(output, "x", zipfile.ZIP_DEFLATED) as archive:
            archive.write(metadata, "metadata.sqlite3")
            archive.writestr("vectors.json", json.dumps({k: vectors[k] for k in ["ids", "documents", "metadatas", "embeddings"]}))
            archive.writestr("manifest.json", json.dumps({"version": 1, "created": datetime.now(timezone.utc).isoformat(), "embedding": "all-MiniLM-L6-v2/384"}))
    return output


def restore_backup(archive_path, target):
    target = Path(target).resolve()
    if target.exists():
        raise ValueError("Restore into a new directory; existing data is never overwritten.")
    with zipfile.ZipFile(archive_path) as archive:
        names = set(archive.namelist())
        if names != {"metadata.sqlite3", "vectors.json", "manifest.json"} or sum(i.file_size for i in archive.infolist()) > LIMIT:
            raise ValueError("Invalid or oversized Synapse backup.")
        manifest = json.loads(archive.read("manifest.json"))
        if manifest.get("version") != 1 or manifest.get("embedding") != "all-MiniLM-L6-v2/384":
            raise ValueError("Unsupported backup format or embedding model.")
        vectors = json.loads(archive.read("vectors.json"))
        metadata = archive.read("metadata.sqlite3")
    ids = vectors.get("ids", [])
    if any(len(vectors.get(k, [])) != len(ids) for k in ["documents", "metadatas", "embeddings"]):
        raise ValueError("Invalid vector records.")
    if any(len(v) != 384 for v in vectors["embeddings"]):
        raise ValueError("Incompatible embedding dimensions.")
    target.mkdir(parents=True)
    (target / "metadata.sqlite3").write_bytes(metadata)
    db = sqlite3.connect(target / "metadata.sqlite3")
    try:
        if db.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise ValueError("Metadata database failed its integrity check.")
        # Restored connections require revalidation and secrets are never backed up.
        db.execute("DELETE FROM kv WHERE key LIKE 'integration:%' OR key LIKE 'job:%'")
        db.commit()
    finally:
        db.close()
    import chromadb
    from chromadb.config import Settings
    collection = chromadb.PersistentClient(path=str(target / "vectors"), settings=Settings(anonymized_telemetry=False)).get_or_create_collection("synapse_v1", metadata={"hnsw:space": "cosine"})
    for start in range(0, len(ids), 100):
        collection.upsert(**{k: vectors[k][start:start+100] for k in ["ids", "documents", "metadatas", "embeddings"]})
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    backup = sub.add_parser("create")
    backup.add_argument("output")
    restore = sub.add_parser("restore")
    restore.add_argument("archive")
    restore.add_argument("--target", required=True)
    args = parser.parse_args()
    if args.command == "create":
        print(create_backup(args.output))
    else:
        print(restore_backup(args.archive, args.target))


if __name__ == "__main__":
    main()
