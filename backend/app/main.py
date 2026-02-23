from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# --- AUTH ---
from app.core.auth import verify_token

# --- INTERNAL MODULES ---
from app.core.memory import MemoryBank
from app.core.ingester import FileIngester
from app.core.llm import LocalLLM
from app.core.orchestrator import system_orchestrator
from app.agents.agent_manager import AgentManager

app = FastAPI(title="Synapse Backend", version="2.2")

# --- CORS POLICY ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INITIALIZATION ---
print("🔌 Booting Synapse Core...")
memory = MemoryBank()
llm = LocalLLM(model="llama3")
agent_manager = AgentManager()

# --- DATA MODELS ---
class Query(BaseModel):
    text: str

class ModeRequest(BaseModel):
    mode: str

# =========================================================
# HEALTH CHECK (Public)
# =========================================================
@app.get("/")
def health_check():
    return {
        "status": "Online",
        "memory_engine": memory.brain.hardware_mode,
        "generation_engine": "Ollama (Simulated GPU)",
        "orchestrator": system_orchestrator.active_mode,
        "agents_active": ["GitHub"]
    }

# =========================================================
# AUTH TEST ROUTE
# =========================================================
@app.get("/protected")
def protected_route(user=Depends(verify_token)):
    return {
        "message": "You are authenticated ✅",
        "clerk_user": user
    }

# =========================================================
# 1️⃣ THE EYES (Protected File Ingestion)
# =========================================================
@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user=Depends(verify_token)
):
    """
    Reads a PDF/Text file and saves it to Vector Memory.
    Requires authentication.
    """
    try:
        raw_text = await FileIngester.parse_file(file)
        chunks = FileIngester.chunk_text(raw_text)

        saved_ids = []
        for chunk in chunks:
            doc_id = memory.memorize(
                chunk,
                metadata={
                    "source": file.filename,
                    "user_id": user.get("sub")  # Clerk user ID
                }
            )
            saved_ids.append(doc_id)

        return {
            "status": "success",
            "filename": file.filename,
            "chunks_processed": len(saved_ids),
            "hardware": memory.brain.hardware_mode,
            "user_id": user.get("sub")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# 2️⃣ THE VOICE & HANDS (Protected RAG + Agents)
# =========================================================
@app.post("/ask")
def ask_synapse(
    query: Query,
    user=Depends(verify_token)
):
    """
    Authenticated RAG + Agentic routing
    """

    print(f"User {user.get('sub')} asked: {query.text}")

    # --- STEP 1: Agent Routing ---
    agent_response = agent_manager.route_request(query.text)

    if agent_response:
        print("🤖 Agent handled the request.")
        return {
            "answer": agent_response,
            "sources": ["External API (GitHub/Tool)"],
            "hardware_flow": "NPU_Router -> External_Tool",
            "user_id": user.get("sub")
        }

    # --- STEP 2: RAG ---
    print("🧠 Searching Memory...")

    results = memory.recall(query.text, n_results=3)
    retrieved_docs = results['documents'][0]

    if not retrieved_docs:
        context_block = "No relevant memory found."
    else:
        context_block = "\n".join(retrieved_docs)

    ai_response = llm.generate_answer(context_block, query.text)

    return {
        "answer": ai_response,
        "sources": retrieved_docs,
        "hardware_flow": f"{memory.brain.hardware_mode} -> ROCm_Sim",
        "user_id": user.get("sub")
    }

# =========================================================
# 3️⃣ THE AUTONOMIC SYSTEM (Protected Mode Switch)
# =========================================================
@app.post("/set_mode")
def change_workflow(
    request: ModeRequest,
    user=Depends(verify_token)
):
    try:
        result = system_orchestrator.set_mode(request.mode)

        return {
            "status": "success",
            "orchestrator_response": result,
            "hardware_used": "Ryzen_AI_NPU (Simulated Classification)",
            "triggered_by": user.get("sub")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)