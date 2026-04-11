from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from .env file
load_dotenv()

# --- INTERNAL MODULES ---
from app.core.memory import MemoryBank
from app.core.ingester import FileIngester
from app.core.llm import LocalLLM
from app.core.orchestrator import system_orchestrator
from app.agents.agent_manager import AgentManager
from app.core.agents import AGENTS  # Default agents
from app.core.agent_store import agent_store  # Custom agents store

app = FastAPI(title="Synapse Backend", version="2.1")

# --- CORS POLICY ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INITIALIZATION ---
print("🔌 Booting Synapse Core...")
memory = MemoryBank()           # The Hippocampus (Database)
llm = LocalLLM(model="llama3")  # The Prefrontal Cortex (Ollama)
agent_manager = AgentManager()  # The Hands (Toolbelt)

# --- DATA MODELS ---
class Query(BaseModel):
    text: str
    selected_sources: list[str] = []
    agent_id: int | None = None

class ModeRequest(BaseModel):
    mode: str

# --- ROUTES ---

@app.get("/")
def health_check():
    return {
        "status": "Online",
        "memory_engine": memory.brain.hardware_mode,
        "generation_engine": "Ollama (Simulated GPU)",
        "orchestrator": system_orchestrator.active_mode,
        "agents_active": ["GitHub"] 
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

# --- 2. THE VOICE & HANDS (Agentic Search) ---
@app.post("/ask")
def ask_synapse(query: Query):
    """
    Logic Flow:
    1. Check Agent Manager (Does user want GitHub/Jira?) -> NPU Task
    2. If Yes -> Run Tool -> Return Result
    3. If No -> Search Memory -> Generate Answer (RAG) -> GPU Task
    """
    print(f"User asked: {query.text}")

    # --- STEP 1: AGENTIC ROUTING (The Switchboard) ---
    # We ask the Agent Manager if this looks like a tool request
    agent_response = agent_manager.route_request(query.text)
    
    if agent_response:
        print("🤖 Agent handled the request.")
        return {
            "answer": agent_response,
            "sources": ["External API (GitHub/Tool)"],
            "hardware_flow": "NPU_Router -> External_Tool"
        }

    # --- STEP 2: STANDARD RAG (The Memory) ---
    print("🧠 No agent needed. Searching Memory...")
    
    # A. Search local memory
    results = memory.recall(
        query.text, 
        n_results=3, 
        source_filters=query.selected_sources
    )
    retrieved_docs = results['documents'][0]
    
    # B. Check if we found anything
    if not retrieved_docs:
        context_block = "No relevant memory found."
    else:
        context_block = "\n".join(retrieved_docs)

    # C. Send to Llama 3 (Ollama)
    try:
        # Check if a specific agent Persona is requested
        system_prompt = None
        if query.agent_id:
            all_agents = agent_store.get_all_agents()
            agent = next((a for a in all_agents if a["id"] == query.agent_id), None)
            if agent:
                system_prompt = agent.get("system_instruction")
                print(f"🎭 Applying Persona: {agent['name']}")

        ai_response = llm.generate_answer(
            context_block, 
            query.text, 
            system_prompt=system_prompt
        )
        
        return {
            "answer": ai_response,
            "sources": retrieved_docs,
            "hardware_flow": f"{memory.brain.hardware_mode} -> ROCm_Sim"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 3. THE AUTONOMIC SYSTEM (Orchestrator) ---
@app.post("/set_mode")
def change_workflow(request: ModeRequest):
    """
    Triggers the OS to rearrange windows/apps.
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

# --- 4. THE MEMORY MANAGER (Source Control) ---
@app.get("/sources")
def list_sources():
    """Returns all unique documentation sources currently in memory."""
    try:
        return memory.get_sources()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/sources/{source_name}")
def delete_source(source_name: str):
    """Removes a source and all its associated vectors from memory."""
    try:
        memory.delete_source(source_name)
        return {"status": "success", "message": f"Source {source_name} deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agents")
def list_agents():
    """Returns all configured specialized personas (defaults + custom)."""
    return agent_store.get_all_agents()

@app.post("/agents")
def create_agent(agent_data: dict):
    """Saves a new custom agent."""
    try:
        return agent_store.add_agent(agent_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/agents/{agent_id}")
def delete_agent(agent_id: int):
    """Removes a custom agent."""
    try:
        success = agent_store.delete_agent(agent_id)
        if not success:
            raise HTTPException(status_code=400, detail="Cannot delete default agent or agent not found")
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mcp/status")
def get_mcp_status():
    """Returns the connection status of all external integrations (GitHub, Slack, etc)."""
    return agent_manager.get_mcp_status()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)