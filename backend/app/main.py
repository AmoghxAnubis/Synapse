from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os
import sys
from typing import Optional

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
from app.core.web_search import web_search_tool
from app.core.terminal_tool import terminal_tool

app = FastAPI(title="Synapse Backend", version="2.2")

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

class WebSearchRequest(BaseModel):
    query: str
    max_results: int = 3

class TerminalRequest(BaseModel):
    command: str

class URLIngestRequest(BaseModel):
    url: str

class IntegrationConnectRequest(BaseModel):
    key: str

# --- ROUTES ---

@app.get("/")
def health_check():
    return {
        "status": "Online",
        "memory_engine": memory.brain.hardware_mode,
        "generation_engine": "Ollama (Simulated GPU)",
        "orchestrator": system_orchestrator.active_mode,
        "agents_active": [a["name"] for a in agent_store.get_all_agents()[:3]]
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
    3. If No -> Check agent capabilities -> Enrich context -> Generate Answer
    """
    print(f"User asked: {query.text}")

    # --- STEP 1: AGENTIC ROUTING (The Switchboard) ---
    agent_response = agent_manager.route_request(query.text)
    
    if agent_response:
        print("🤖 Agent handled the request.")
        return {
            "answer": agent_response,
            "sources": ["External API (GitHub/Tool)"],
            "hardware_flow": "NPU_Router -> External_Tool"
        }

    # --- STEP 2: LOAD AGENT CONFIG ---
    agent = None
    system_prompt = None
    if query.agent_id:
        agent = agent_store.get_agent_by_id(query.agent_id)
        if agent:
            system_prompt = agent.get("system_instruction")
            print(f"🎭 Applying Persona: {agent['name']}")

    # --- STEP 3: CAPABILITY-AWARE CONTEXT BUILDING ---
    extra_context = ""
    capabilities = agent.get("capabilities", {}) if agent else {}

    # Web Search capability
    if capabilities.get("web_search"):
        print("🌐 Agent has web search — searching...")
        try:
            web_results = web_search_tool.search(query.text, max_results=3)
            extra_context += f"\n\n--- WEB SEARCH RESULTS ---\n{web_results}\n"
            print(f"🌐 Found web results")
        except Exception as e:
            print(f"⚠️ Web search failed: {e}")

    # --- STEP 4: MEMORY SEARCH (source-scoped) ---
    # Use agent's linked_sources if set, otherwise use user's selection
    source_filters = query.selected_sources
    if agent and agent.get("linked_sources"):
        source_filters = agent["linked_sources"]
        print(f"📚 Scoping to agent sources: {source_filters}")

    results = memory.recall(
        query.text, 
        n_results=3, 
        source_filters=source_filters
    )
    retrieved_docs = results['documents'][0]
    
    # Build context
    if not retrieved_docs:
        context_block = "No relevant memory found."
    else:
        context_block = "\n".join(retrieved_docs)

    # Add web results to context
    context_block += extra_context

    # --- STEP 5: LLM GENERATION ---
    try:
        ai_response = llm.generate_answer(
            context_block, 
            query.text, 
            system_prompt=system_prompt
        )
        
        return {
            "answer": ai_response,
            "sources": retrieved_docs,
            "hardware_flow": f"{memory.brain.hardware_mode} -> ROCm_Sim",
            "capabilities_used": [k for k, v in capabilities.items() if v] if capabilities else []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 3. THE AUTONOMIC SYSTEM (Orchestrator) ---
@app.post("/set_mode")
def change_workflow(request: ModeRequest):
    """Triggers the OS to rearrange windows/apps."""
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

# --- 5. AGENT MANAGEMENT ---
@app.get("/agents")
def list_agents():
    """Returns all configured specialized personas (defaults + custom)."""
    return agent_store.get_all_agents()

@app.get("/agents/{agent_id}")
def get_agent(agent_id: int):
    """Returns a single agent by ID."""
    agent = agent_store.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@app.post("/agents")
def create_agent(agent_data: dict):
    """Saves a new custom agent."""
    try:
        # Ensure capabilities field exists
        if "capabilities" not in agent_data:
            agent_data["capabilities"] = {"web_search": False, "terminal": False}
        if "linked_sources" not in agent_data:
            agent_data["linked_sources"] = []
        return agent_store.add_agent(agent_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/agents/{agent_id}")
def update_agent(agent_id: int, updates: dict):
    """Update system_instruction, capabilities, or linked sources."""
    try:
        result = agent_store.update_agent(agent_id, updates)
        if result is None:
            raise HTTPException(status_code=404, detail="Agent not found or no valid fields")
        return result
    except HTTPException:
        raise
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

# --- 6. AGENT CAPABILITY TOOLS ---
@app.post("/tools/web-search")
def web_search(body: WebSearchRequest):
    """Standalone web search endpoint."""
    try:
        results = web_search_tool.search(body.query, body.max_results)
        return {"status": "success", "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tools/terminal")
def run_terminal(body: TerminalRequest):
    """Execute a shell command (sandboxed with safety checks)."""
    try:
        result = terminal_tool.execute(body.command)
        return {"status": "success", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 7. MCP STATUS ---
@app.get("/mcp/status")
def get_mcp_status():
    """Returns the connection status of all external integrations."""
    return agent_manager.get_mcp_status()

# --- 8. INTEGRATION MANAGEMENT ---
@app.post("/integrations/{platform}/connect")
def connect_integration(platform: str, body: IntegrationConnectRequest):
    """Store an API key and reinitialize the relevant MCP server."""
    valid_platforms = ["github", "slack", "notion", "jira", "discord"]
    if platform not in valid_platforms:
        raise HTTPException(status_code=400, detail=f"Unknown platform: {platform}")
    
    try:
        # Store the key in environment
        env_map = {
            "github": "GITHUB_TOKEN",
            "slack": "SLACK_TOKEN",
            "notion": "NOTION_TOKEN",
            "jira": "JIRA_TOKEN",
            "discord": "DISCORD_TOKEN",
        }
        os.environ[env_map[platform]] = body.key
        
        return {
            "status": "success",
            "platform": platform,
            "connected": True,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/integrations/{platform}/sync")
def sync_integration(platform: str):
    """Pull data from the MCP server and ingest into ChromaDB."""
    try:
        server_map = {
            "github": agent_manager.mcp_github_server,
            "notion": getattr(agent_manager, 'mcp_notion_server', None),
            "jira": getattr(agent_manager, 'mcp_jira_server', None),
            "slack": getattr(agent_manager, 'mcp_slack_server', None),
            "discord": getattr(agent_manager, 'mcp_discord_server', None),
        }
        
        server = server_map.get(platform)
        if not server:
            raise HTTPException(status_code=400, detail=f"{platform} server not available")
        
        if not server.is_connected():
            raise HTTPException(status_code=400, detail=f"{platform} not connected. Check API key.")
        
        # Try to get data from the server
        documents = []
        try:
            if platform == "github":
                # List repos and get their details
                result = server.execute_command({"operation": "list_repos"})
                if result.get("success") and result.get("repositories"):
                    for repo in result["repositories"][:5]:
                        documents.append(f"GitHub Repo: {repo['name']}\nDescription: {repo.get('description', 'N/A')}\nLanguage: {repo.get('language', 'N/A')}\nStars: {repo.get('stars', 0)}")
                        
            elif platform == "notion":
                result = server.execute_command({"operation": "list_pages"})
                if result.get("success") and result.get("pages"):
                    for page in result["pages"][:10]:
                        documents.append(f"Notion Page: {page.get('title', 'Untitled')}\nID: {page.get('id', 'N/A')}")

            elif platform == "jira":
                result = server.execute_command({"operation": "list_projects"})
                if result.get("success") and result.get("projects"):
                    for proj in result["projects"][:5]:
                        documents.append(f"Jira Project: {proj['name']}\nKey: {proj['key']}")

            elif platform == "slack":
                result = server.execute_command({"operation": "list_channels"})
                if result.get("success") and result.get("channels"):
                    for ch in result["channels"][:10]:
                        documents.append(f"Slack Channel: #{ch['name']}\nTopic: {ch.get('topic', 'N/A')}")

            elif platform == "discord":
                result = server.execute_command({"operation": "list_guilds"})
                if result.get("success") and result.get("guilds"):
                    for guild in result["guilds"][:5]:
                        documents.append(f"Discord Server: {guild['name']}\nID: {guild.get('id', 'N/A')}")

        except Exception as e:
            print(f"⚠️ Error fetching {platform} data: {e}")
        
        if not documents:
            return {
                "status": "success",
                "platform": platform,
                "documents_ingested": 0,
                "chunks_created": 0,
                "hardware": memory.brain.hardware_mode,
                "message": f"Connected but no data found to sync from {platform}."
            }
        
        # Ingest documents into memory
        total_chunks = 0
        for doc in documents:
            chunks = FileIngester.chunk_text(doc, chunk_size=200)
            for chunk in chunks:
                memory.memorize(chunk, metadata={"source": f"{platform}_sync"})
                total_chunks += 1
        
        return {
            "status": "success",
            "platform": platform,
            "documents_ingested": len(documents),
            "chunks_created": total_chunks,
            "hardware": memory.brain.hardware_mode,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/integrations/status")
def get_integration_statuses():
    """Per-platform connection status."""
    mcp_status = agent_manager.get_mcp_status()
    result = {}
    for platform, status in mcp_status.items():
        connected = status.get("connected", False) if isinstance(status, dict) else False
        result[platform] = {
            "connected": connected,
            "last_synced": None,  # Could track in a file later
        }
    return result

# --- 9. URL INGESTION ---
@app.post("/ingest/url")
async def ingest_url(req: URLIngestRequest):
    """Scrape a URL and ingest its text into vector memory."""
    try:
        import httpx
        from bs4 import BeautifulSoup
        
        headers = {"User-Agent": "Mozilla/5.0 Synapse/1.0"}
        async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
            resp = await client.get(req.url, headers=headers)
        
        soup = BeautifulSoup(resp.text, "html.parser")
        
        # Remove script and style elements
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        
        text = soup.get_text(separator="\n", strip=True)
        
        if not text or len(text) < 50:
            raise HTTPException(status_code=400, detail="Could not extract meaningful text from URL")
        
        # Chunk and memorize
        chunks = FileIngester.chunk_text(text, chunk_size=400)
        saved = 0
        for chunk in chunks:
            memory.memorize(chunk, metadata={"source": req.url})
            saved += 1
        
        return {
            "status": "success",
            "url": req.url,
            "chunks_processed": saved,
            "hardware": memory.brain.hardware_mode,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 10. MEETINGS PERSISTENCE ---
import json

MEETINGS_FILE = "./meetings_data.json"

def _load_meetings():
    try:
        with open(MEETINGS_FILE, "r") as f:
            return json.load(f)
    except:
        return {"notes": "", "tasks": []}

def _save_meetings(data):
    with open(MEETINGS_FILE, "w") as f:
        json.dump(data, f, indent=2)

@app.get("/meetings")
def get_meetings():
    """Get saved notes and tasks."""
    return _load_meetings()

@app.post("/meetings")
def save_meetings(data: dict):
    """Save notes and tasks."""
    _save_meetings(data)
    return {"status": "success"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)