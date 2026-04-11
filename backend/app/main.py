from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

from app.core.memory import MemoryBank
from app.core.ingester import FileIngester
from app.core.llm import LocalLLM
from app.core.orchestrator import system_orchestrator
from app.agents.agent_manager import AgentManager

app = FastAPI(title="Synapse Backend", version="2.2-UNIFIED")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("🔌 Booting Synapse...")
memory = MemoryBank()
llm = LocalLLM(model="llama3")
agent_manager = AgentManager()

class Query(BaseModel):
    text: str
    use_context: bool = True

class ToggleContextRequest(BaseModel):
    use_context: bool

class ModeRequest(BaseModel):
    mode: str

class ListMemoryRequest(BaseModel):
    limit: int = 50
    offset: int = 0
    query: Optional[str] = None

class DeleteMemoryRequest(BaseModel):
    ids: list[str]

class MemoryItem(BaseModel):
    id: str
    document: str
    metadata: dict
    source: str

class UnifiedResponse(BaseModel):
    message: str
    mode: str
    used_context: bool
    action_taken: Optional[str] = None
    sources: List[str] = []
    intent: str

@app.get("/")
def health():
    return {
        "status": "Online",
        "orchestrator": system_orchestrator.get_active_mode(),
        "memory": getattr(memory.brain, 'hardware_mode', 'NPU'),
        "llm": llm.model,
        "agents": ["github", "notion", "jira", "slack", "discord"],
        "use_context": memory.use_context
    }

@app.post("/ask", response_model=UnifiedResponse)
def ask(query: Query):
    mode_data = system_orchestrator.detect_mode(query.text)
    mode = mode_data["mode"]
    intent = mode_data["intent"]
    
    context_results = memory.recall(query.text, n_results=3, use_context=query.use_context, mode=mode)
    retrieved_docs = context_results['documents'][0]
    context_block = "\n".join(retrieved_docs) if retrieved_docs else "No context."
    
    action_plan = agent_manager.decide(query.text, context_block, mode)
    tool_result = None
    if action_plan:
        tool_result = agent_manager.execute(action_plan)
        memory.memorize(f"Action {action_plan.target}", mode=mode)
    
    memory.memorize(query.text, mode=mode)
    
    response = llm.generate_answer(query.text, context_block, mode, tool_result)
    
    return UnifiedResponse(
        message=response,
        mode=mode,
        used_context=bool(retrieved_docs),
        action_taken=action_plan.target if action_plan else None,
        sources=retrieved_docs or [],
        intent=intent
    )

@app.post("/chat/toggle_context")
def toggle_context(request: ToggleContextRequest):
    memory.use_context = request.use_context
    return {"status": "success"}

@app.post("/set_mode")
def set_mode(request: ModeRequest):
    return system_orchestrator.set_mode(request.mode)

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    try:
        raw_text = await FileIngester.parse_file(file)
        chunks = FileIngester.chunk_text(raw_text)
        saved_ids = [memory.memorize(chunk, {"source": file.filename}) for chunk in chunks]
        return {"status": "success", "chunks": len(saved_ids)}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/memory/list", response_model=List[MemoryItem])
def list_memory(request: ListMemoryRequest):
    try:
        where = {"source": {"$contains": request.query}} if request.query else None
        results = memory.collection.get(limit=request.limit, offset=request.offset, where=where)
        items = []
        for i in range(len(results['ids'][0])):
            md = results['metadatas'][0][i]
            items.append(MemoryItem(id=results['ids'][0][i], document=results['documents'][0][i], metadata=md, source=md.get('source', 'unknown')))
        return items
    except:
        return []

@app.post("/memory/delete")
def delete_memory(request: DeleteMemoryRequest):
    try:
        memory.collection.delete(ids=request.ids)
        return {"status": "success"}
    except:
        raise HTTPException(500, "Failed")

@app.post("/memory/clear")
def clear_memory():
    try:
        memory.collection.delete_all()
        return {"status": "success"}
    except:
        raise HTTPException(500, "Failed")

@app.get("/mcp_status")
def mcp_status():
    try:
        status = agent_manager.get_mcp_status()
        return {"status": "success", "servers": list(status.keys())}
    except:
        return {"status": "error", "servers": []}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

