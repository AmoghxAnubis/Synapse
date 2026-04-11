import chromadb
import uuid
import os
from app.core.amd_bridge import AMDBridge

class MemoryBank:
    def __init__(self):
        print("Initializing Synapse Memory (ChromaDB)...")
        # Initialize the AMD Bridge for embeddings
        self.brain = AMDBridge()
        
        # Initialize Local Database (Persistent)
        # Point to the root directory's database to avoid relative path issues
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        db_path = os.path.join(project_root, "synapse_memory_db")
        self.client = chromadb.PersistentClient(path=db_path)
        
        # Create or Get the collection (Like a folder for memories)
        self.collection = self.client.get_or_create_collection(name="project_alpha")

    def memorize(self, text, metadata={"source": "user_input"}):
        """
        1. Uses AMD Bridge to turn text -> vector.
        2. Saves text + vector to ChromaDB.
        """
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

    def recall(self, query_text, n_results=3, source_filter=None):
        """
        1. Turns query -> vector.
        2. Finds closest vectors in DB (optionally filtered by source).
        """
        # Step 1: NPU Workload
        query_vector = self.brain.embed_text(query_text)
        
        # Step 2: Retrieval with optional filter
        where_clause = None
        if source_filter:
            if len(source_filter) == 1:
                where_clause = {"source": source_filter[0]}
            else:
                where_clause = {"source": {"$in": source_filter}}

        results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=n_results,
            where=where_clause
        )
        return results

    def get_all_sources(self):
        """
        Retrieves unique source names from all stored documents.
        """
        results = self.collection.get(include=['metadatas'])
        metadatas = results.get('metadatas', [])
        
        # Extract unique source names
        sources = set()
        for meta in metadatas:
            if meta and 'source' in meta:
                sources.add(meta['source'])
        
        return list(sources)

# TEST RUNNER
if __name__ == "__main__":
    mem = MemoryBank()
    
    # Teach it something
    print("Learning...")
    mem.memorize("The hackathon project is called Synapse.")
    mem.memorize("Synapse uses AMD Ryzen AI for embeddings.")
    
    # Ask it something
    print("Searching for 'AMD'...")
    results = mem.recall("What does Synapse use?")
    
    print(f"✅ Found: {results['documents'][0][0]}")