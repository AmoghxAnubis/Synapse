"""Preserve both legacy memory stores and re-embed text into the stable store."""
import json
import shutil
import sqlite3
from datetime import datetime, timezone
from .core.config import BACKEND_DIR, DATA_DIR, prepare_data_dir


def preserve_legacy():
    prepare_data_dir()
    destination = DATA_DIR / "backups" / ("legacy-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S"))
    destination.mkdir(parents=True, exist_ok=False)
    sources = [("root-memory", BACKEND_DIR.parent / "synapse_memory_db"),
               ("backend-memory", BACKEND_DIR / "synapse_memory_db")]
    for name, source in sources:
        if source.exists():
            target = destination / name
            shutil.copytree(source, target)
            # Capture a consistent SQLite snapshot even if WAL files exist.
            database = source / "chroma.sqlite3"
            if database.exists():
                original = sqlite3.connect(f"file:{database.as_posix()}?mode=ro", uri=True)
                copy = sqlite3.connect(target / "chroma.sqlite3")
                try:
                    original.backup(copy)
                finally:
                    original.close()
                    copy.close()
    for name in ("agents.json", "meetings_data.json"):
        source = BACKEND_DIR / name
        if source.exists():
            shutil.copy2(source, destination / name)
    return destination


def main():
    import chromadb
    from chromadb.config import Settings
    from .core.memory import MemoryBank
    backup = preserve_legacy()
    print(f"Original data preserved: {backup}")
    memory = MemoryBank()
    imported = 0
    # Prefix identities when sources from both databases collide; keep both.
    for database in sorted(backup.iterdir()):
        if not database.is_dir():
            continue
        client = chromadb.PersistentClient(path=str(database), settings=Settings(anonymized_telemetry=False))
        for collection in client.list_collections():
            records = collection.get(include=["documents", "metadatas"])
            grouped = {}
            for text, metadata in zip(records["documents"], records["metadatas"]):
                if text and text.strip():
                    name = (metadata or {}).get("source", "legacy")
                    grouped.setdefault(name, []).append(text)
            for source, texts in grouped.items():
                unique = list(dict.fromkeys(texts))
                name = f"legacy:{database.name}:{source}"
                memory.ingest_document(name, [{"page": 1, "text": "\n\n".join(unique)}])
                imported += 1
    print(f"Migrated {imported} sources. Original directories were not changed.")


if __name__ == "__main__":
    main()
