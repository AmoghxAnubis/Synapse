import chromadb
import uuid
from typing import Optional, Dict, Any
from app.core.amd_bridge import AMDBridge

class MemoryBank:
    def __init__(self):
        print("💾 Initializing Synapse Memory (ChromaDB)...")
        self.use_context = True  # Global toggle for RAG
        # Initialize the AMD Bridge for embeddings
        self.brain = AMDBridge()
        
        # Initialize Local Database (Persistent)
        self.client = chromadb.PersistentClient(path="./synapse_memory_db")
        
        # Create or Get the collection (Like a folder for memories)
        self.collection = self.client.get_or_create_collection(name="project_alpha")

    def memorize(self, text: str, metadata: Dict[str, Any] = None, mode: Optional[str] = None) -> str:
        """
        1. Uses AMD Bridge to turn text -> vector.
        2. Saves text + vector to ChromaDB with optional mode metadata.
        """
        if metadata is None:
            metadata = {"source": "user_input"}
        
        # Add mode to metadata if provided
        if mode:
            metadata["mode"] = mode
            
        # Step 1: NPU Workload (Embedding)
        vector = self.brain.embed_text(text)
        
        # Step 2: Storage
        doc_id = str(uuid.uuid4())
        self.collection.add(
            ids=[doc_id],
            documents=[text],
            embeddings=[vector],
            metadatas=[metadata]
        )
        return doc_id

    def recall(self, query_text: str, n_results: int = 3, use_context: bool = True, mode: Optional[str] = None) -> Dict[str, Any]:
        """
        1. Turns query -> vector.
        2. Finds closest vectors in DB (mode-filtered if specified), skipped if disabled.
        """
        if not use_context or not self.use_context:
            return {'documents': [[]], 'distances': [[]], 'metadatas': [[]], 'ids': [[]]}
        
        # Build where filter
        where_filter = {}
        if mode:
            where_filter["mode"] = {"$eq": mode}
            
        # Step 1: NPU Workload
        query_vector = self.brain.embed_text(query_text)
        
        # Step 2: Retrieval with optional mode filter
        results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=n_results,
            where=where_filter if where_filter else None
        )
        return results

# TEST RUNNER
if __name__ == "__main__":
    mem = MemoryBank()
    
    # Teach it something with modes
    print("\n📝 Learning...")
    mem.memorize("The hackathon project is called Synapse.", mode="FOCUS")
    mem.memorize("Synapse uses AMD Ryzen AI for embeddings.", mode="RESEARCH")
    
    # Ask it something
    print("🕵️ Searching for 'AMD'...")
    results = mem.recall("What does Synapse use?", mode="RESEARCH")
    
    print(f"✅ Found: {results['documents'][0][0] if results['documents'][0] else 'Nothing'}")

