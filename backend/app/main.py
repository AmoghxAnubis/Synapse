from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.core.memory import MemoryBank
from app.core.ingester import FileIngester
from app.core.llm import LocalLLM
from app.core.orchestrator import system_orchestrator # <--- NEW IMPORT
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Synapse Backend", version="2.0")

# --- CORS POLICY (Allowed for Frontend) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INITIALIZATION ---
print("🔌 Booting Synapse Core...")
memory = MemoryBank()           # The Database (Hippocampus)
llm = LocalLLM(model="llama3")  # The Bridge to Ollama (Prefrontal Cortex)

# --- DATA MODELS ---
class Query(BaseModel):
    text: str

class ModeRequest(BaseModel):   # <--- NEW MODEL
    mode: str

# --- ROUTES ---

@app.get("/")
def health_check():
    return {
        "status": "Online",
        "memory_engine": memory.brain.hardware_mode, # CPU or NPU
        "generation_engine": "Ollama (Simulated GPU)",
        "orchestrator": system_orchestrator.active_mode
    }

# --- 1. THE EYES (File Ingestion) ---
@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Reads a PDF/Text file and saves it to Vector Memory."""
    try:
        # A. Parse Text
        raw_text = await FileIngester.parse_file(file)
        
        # B. Chunk Text
        chunks = FileIngester.chunk_text(raw_text)
        
        # C. Memorize Each Chunk
        saved_ids = []
        for chunk in chunks:
            doc_id = memory.memorize(chunk, metadata={"source": file.filename})
            saved_ids.append(doc_id)
            
        return {
            "status": "success", 
            "filename": file.filename, 
            "chunks_processed": len(saved_ids),
            "hardware": memory.brain.hardware_mode
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 2. THE VOICE (RAG Search) ---
@app.post("/ask")
def ask_synapse(query: Query):
    """
    Search Memory -> Send to Llama 3 -> Return Answer
    """
    print(f"User asked: {query.text}")
    
    # Step A: Search local memory
    results = memory.recall(query.text, n_results=3)
    retrieved_docs = results['documents'][0]
    
    # Step B: Check if we found anything
    if not retrieved_docs:
        context_block = "No relevant memory found."
    else:
        context_block = "\n".join(retrieved_docs)

    # Step C: Send to Llama 3 (Ollama)
    ai_response = llm.generate_answer(context_block, query.text)
    
    return {
        "answer": ai_response,
        "sources": retrieved_docs,
        "hardware_flow": f"{memory.brain.hardware_mode} -> ROCm_Sim"
    }

# --- 3. THE HANDS (Orchestrator) --- <--- NEW SECTION
@app.post("/set_mode")
def change_workflow(request: ModeRequest):
    """
    Triggers the OS to rearrange windows/apps.
    Options: 'MEETING', 'RESEARCH', 'FOCUS'
    """
    try:
        result = system_orchestrator.set_mode(request.mode)
        return {
            "status": "success",
            "orchestrator_response": result,
            "hardware_used": "Ryzen_AI_NPU (Simulated Classification)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)