import chromadb
from app.core.memory import MemoryBank

def debug_memory():
    print("Debugging Synapse Memory...")
    mem = MemoryBank()
    
    # Get all documents and their metadata
    results = mem.collection.get(include=['metadatas', 'documents'])
    
    ids = results.get('ids', [])
    metadatas = results.get('metadatas', [])
    documents = results.get('documents', [])
    
    print(f"📊 Total segments in DB: {len(ids)}")
    
    sources = set()
    for meta in metadatas:
        if meta and 'source' in meta:
            sources.add(meta['source'])
            
    print(f"📂 Unique sources found: {sources}")
    
    if len(ids) > 0:
        print("\n🔍 Sample Metadata:")
        print(metadatas[0])
        print("\n🔍 Sample Content:")
        print(documents[0][:100] + "...")

if __name__ == "__main__":
    debug_memory()
