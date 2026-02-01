from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.core.memory import MemoryBank
from app.core.ingester import FileIngester
from app.core.llm import LocalLLM
import uvicorn

app = FastAPI(title="Synapse Backend", version="2.0")

# Initialize Systems
print("🔌 Booting Systems...")
memory = MemoryBank()
llm = LocalLLM(model="llama3") # Make sure you have this model in Ollama

class Query(BaseModel):
    text: str

@app.get("/")
def health_check():
    return {
        "status": "Online",
        "memory_engine": memory.brain.hardware_mode, # CPU or NPU
        "generation_engine": "Ollama (Simulated GPU)"
    }

# --- 1. THE EYES (File Ingestion) ---
@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Reads a PDF/Text file and saves it to Vector Memory."""
    try:
        # A. Parse Text
        raw_text = await FileIngester.parse_file(file)
        
        # B. Chunk Text (Don't save whole book as one row)
        chunks = FileIngester.chunk_text(raw_text)
        
        # C. Memorize Each Chunk
        saved_ids = []
        for chunk in chunks:
            # We add metadata so we know which file this came from
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
    1. Search Memory (NPU Task)
    2. Generate Answer (GPU Task)
    """
    # Step A: Recall (Search ChromaDB)
    results = memory.recall(query.text, n_results=3)
    retrieved_docs = results['documents'][0]
    
    if not retrieved_docs:
        return {"answer": "I don't have any memory of that.", "context": []}
    
    # Step B: Reason (Send to LLM)
    context_block = "\n".join(retrieved_docs)
    generated_answer = llm.generate_answer(context_block, query.text)
    
    return {
        "answer": generated_answer,
        "context_used": retrieved_docs,
        "hardware_flow": f"{memory.brain.hardware_mode} -> ROCm_Sim"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)