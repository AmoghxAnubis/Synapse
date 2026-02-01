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

    def recall(self, query_text, n_results=3):
        """
        1. Turns query -> vector.
        2. Finds closest vectors in DB.
        """
        # Step 1: NPU Workload
        query_vector = self.brain.embed_text(query_text)
        
        # Step 2: Retrieval
        results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=n_results
        )
        return results

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