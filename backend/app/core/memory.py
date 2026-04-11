import chromadb
import uuid
from app.core.amd_bridge import AMDBridge

class MemoryBank:
    def __init__(self):
        print("💾 Initializing Synapse Memory (ChromaDB)...")
        # Initialize the AMD Bridge for embeddings
        self.brain = AMDBridge()
        
        # Initialize Local Database (Persistent)
        self.client = chromadb.PersistentClient(path="./synapse_memory_db")
        
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

    def recall(self, query_text, n_results=3, source_filters=None):
        """
        1. Turns query -> vector.
        2. Finds closest vectors in DB.
        """
        # Step 1: NPU Workload
        query_vector = self.brain.embed_text(query_text)
        
        # Step 2: Retrieval with optional filtering
        where_clause = None
        if source_filters and len(source_filters) > 0:
            if len(source_filters) == 1:
                where_clause = {"source": source_filters[0]}
            else:
                where_clause = {"source": {"$in": source_filters}}

        results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=n_results,
            where=where_clause
        )
        return results

    def get_sources(self):
        """
        Retrieves all unique source names from metadata.
        Returns a list of dictionaries: [{"name": "file.pdf", "chunks": 5}]
        """
        results = self.collection.get(include=['metadatas'])
        metadatas = results.get('metadatas', [])
        
        source_counts = {}
        for meta in metadatas:
            source = meta.get('source', 'unknown')
            # Skip internal tags if needed, but for now we show all
            source_counts[source] = source_counts.get(source, 0) + 1
            
        return [{"name": name, "chunks": count} for name, count in source_counts.items()]

    def delete_source(self, source_name):
        """
        Deletes all chunks associated with a specific source.
        """
        self.collection.delete(where={"source": source_name})
        return True

# TEST RUNNER
if __name__ == "__main__":
    mem = MemoryBank()
    
    # Teach it something
    print("\n📝 Learning...")
    mem.memorize("The hackathon project is called Synapse.")
    mem.memorize("Synapse uses AMD Ryzen AI for embeddings.")
    
    # Ask it something
    print("🕵️ Searching for 'AMD'...")
    results = mem.recall("What does Synapse use?")
    
    print(f"✅ Found: {results['documents'][0][0]}")