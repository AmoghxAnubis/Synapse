"""Deterministic document replacement with provenance and cosine retrieval."""
import hashlib
import threading
from .config import DATA_DIR
from .ingester import FileIngester


class MemoryBank:
    def __init__(self, brain=None, client=None):
        if brain is None:
            from .amd_bridge import AMDBridge
            brain = AMDBridge()
        if client is None:
            import chromadb
            from chromadb.config import Settings
            client = chromadb.PersistentClient(path=str(DATA_DIR / "vectors"), settings=Settings(anonymized_telemetry=False))
        self.brain = brain
        self.client = client
        self.collection = client.get_or_create_collection(name="synapse_v1", metadata={"hnsw:space": "cosine"})
        self.lock = threading.RLock()

    def ingest_document(self, source, pages, url="", platform="local", cancel=None):
        document_id = hashlib.sha256(source.encode()).hexdigest()
        text_hash = hashlib.sha256("\n".join(p["text"] for p in pages).encode()).hexdigest()
        with self.lock:
            existing = self.collection.get(where={"document_id": document_id}, include=["metadatas"])
            if existing["ids"] and all(m.get("content_hash") == text_hash and m.get("chunk_format") == 2 for m in existing["metadatas"]):
                return {"chunks_processed": len(existing["ids"]), "unchanged": True}
            texts, metadata, ids, vectors = [], [], [], []
            for page in pages:
                for chunk in FileIngester.chunk_text(page["text"], tokenizer=self.brain.tokenizer):
                    if cancel and cancel.is_set():
                        raise InterruptedError("Import cancelled")
                    index = len(ids)
                    ids.append(f"{document_id}:{index}")
                    texts.append(chunk)
                    metadata.append({"source": source, "document_id": document_id, "page": page.get("page", 1), "chunk": index + 1, "url": url, "platform": platform, "content_hash": text_hash, "chunk_format": 2})
                    vectors.append(self.brain.embed_text(chunk))
            if not ids:
                raise ValueError("Document has no readable text")
            if cancel and cancel.is_set():
                raise InterruptedError("Import cancelled")
            # Prepare every vector before replacing existing records.
            for start in range(0, len(ids), 100):
                self.collection.upsert(ids=ids[start:start+100], documents=texts[start:start+100], embeddings=vectors[start:start+100], metadatas=metadata[start:start+100])
            stale = list(set(existing["ids"]) - set(ids))
            if stale:
                self.collection.delete(ids=stale)
            return {"chunks_processed": len(ids), "unchanged": False}

    def recall(self, query_text, n_results=5, source_filters=None, max_distance=0.65):
        with self.lock:
            count = self.collection.count()
            if not count or source_filters == []:
                return []
            where = {"source": {"$in": source_filters}} if source_filters else None
            results = self.collection.query(query_embeddings=[self.brain.embed_text(query_text)], n_results=min(n_results, count), where=where, include=["documents", "metadatas", "distances"])
            records = []
            for text, meta, distance, identifier in zip(results["documents"][0], results["metadatas"][0], results["distances"][0], results["ids"][0]):
                if distance <= max_distance:
                    records.append({"id": identifier, "source": meta["source"], "page": meta.get("page", 1), "chunk": meta.get("chunk", 1), "url": meta.get("url", ""), "text": text, "distance": round(distance, 4)})
            return records

    def get_sources(self):
        with self.lock:
            results = self.collection.get(include=["metadatas"])
        records = {}
        for meta in results["metadatas"]:
            name = meta["source"]
            records.setdefault(name, {"name": name, "chunks": 0, "url": meta.get("url", ""), "platform": meta.get("platform", "local")})
            records[name]["chunks"] += 1
        return sorted(records.values(), key=lambda row: row["name"])

    def source_chunks(self, source):
        with self.lock:
            results = self.collection.get(where={"source": source}, include=["documents", "metadatas"])
        return [{"id": identifier, "text": text, **meta} for identifier, text, meta in zip(results["ids"], results["documents"], results["metadatas"])]

    def delete_source(self, source):
        with self.lock:
            self.collection.delete(where={"source": source})
