from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.core.memory import MemoryBank
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# 1. Initialize App & Memory
app = FastAPI(title="Synapse Core", version="1.0.0")

# Allow the Frontend (Next.js) to talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change this to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("🔌 Connecting to Memory Bank...")
memory = MemoryBank()

# --- DATA MODELS (The Shape of Data) ---
class Note(BaseModel):
    text: str
    source: str = "web_ui"

class Query(BaseModel):
    text: str

# --- ROUTES ( The Endpoints) ---

@app.get("/")
def health_check():
    """Checks if the NPU/CPU logic is active."""
    return {
        "status": "Synapse Online", 
        "hardware_mode": memory.brain.hardware_mode
    }

@app.post("/ingest")
def add_memory(note: Note):
    """Save a thought/file content to the vector database."""
    try:
        doc_id = memory.memorize(note.text, {"source": note.source})
        return {
            "status": "success", 
            "id": doc_id, 
            "mode": memory.brain.hardware_mode
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
def search_memory(query: Query):
    """Retrieve relevant thoughts based on meaning."""
    results = memory.recall(query.text)
    
    # Check if we found anything
    if not results['documents'][0]:
        return {"results": [], "message": "No memories found."}
        
    # Return the list of found texts
    return {
        "results": results['documents'][0], 
        "hardware_used": memory.brain.hardware_mode
    }

# Start Server command (for debugging)
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)