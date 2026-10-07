"""Local-first API with explicit sessions, jobs, citations, and action approvals."""
from contextlib import asynccontextmanager
import json
import logging
import threading
from pathlib import Path
from fastapi import APIRouter, Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.concurrency import run_in_threadpool
from dotenv import load_dotenv
from .core.config import BACKEND_DIR, DATA_DIR, MAX_UPLOAD_BYTES
from .core.security import api_token, require_session
from .core.storage import Storage
from .core.agent_store import AgentStore
from .core.ingester import FileIngester
from .core.llm import LocalLLM
from .core.integrations import IntegrationService
from .core.actions import ActionService
from .core.jobs import JobManager
from .core.terminal_tool import terminal_tool
from .schemas import (ActionPreview, AgentCreate, AgentUpdate, IntegrationConnect,
                      Meetings, ModeRequest, Platform, Query, SearchRequest,
                      Settings, TerminalRequest, URLIngest)

load_dotenv(BACKEND_DIR / ".env")
logger = logging.getLogger("synapse")


class Services:
    def __init__(self, storage, memory_factory, llm_factory):
        self.storage = storage
        self.agents = AgentStore(storage)
        self.integrations = IntegrationService(storage)
        self.actions = ActionService(storage, self.integrations)
        self.jobs = JobManager(storage)
        self.memory_factory = memory_factory
        self.llm_factory = llm_factory
        self._memory = None
        self.memory_lock = threading.Lock()
        self.chat_lock = threading.Lock()
        self.sync_lock = threading.Lock()
        # Interrupted jobs must not remain falsely queued after restart.
        with storage.connect() as db:
            for row in db.execute("SELECT key,value FROM kv WHERE key LIKE 'job:%'").fetchall():
                data = json.loads(row["value"])
                if data["status"] in ("queued", "running"):
                    data.update(status="failed", error="Backend restarted. Retry this import.")
                    db.execute("UPDATE kv SET value=? WHERE key=?", (json.dumps(data), row["key"]))
        if storage.get("meetings") is None:
            legacy = BACKEND_DIR / "meetings_data.json"
            data = json.loads(legacy.read_text(encoding="utf-8")) if legacy.exists() else {}
            storage.set("meetings", Meetings.model_validate(data).model_dump())

    @property
    def memory(self):
        with self.memory_lock:
            if self._memory is None:
                self._memory = self.memory_factory()
            return self._memory

    @property
    def settings(self):
        return Settings.model_validate(self.storage.get("settings", {}))

    @property
    def llm(self):
        settings = self.settings
        return self.llm_factory(model=settings.model, base_url=settings.ollama_url)

    def network(self):
        if not self.settings.network_enabled:
            raise HTTPException(403, "Connected features are disabled. Enable network access in Settings.")

    def agent(self, identifier):
        if identifier is None:
            return None
        agent = self.agents.get_agent_by_id(identifier)
        if not agent:
            raise HTTPException(404, "Agent not found")
        return agent


def create_app(storage=None, memory_factory=None, llm_factory=LocalLLM):
    if memory_factory is None:
        def memory_factory():
            from .core.memory import MemoryBank
            return MemoryBank()

    @asynccontextmanager
    async def lifespan(application):
        api_token()
        application.state.services = Services(storage or Storage(), memory_factory, llm_factory)
        logger.info("Local API ready. Pairing token: %s", DATA_DIR / "api-token")
        try:
            yield
        finally:
            application.state.services.jobs.close()

    application = FastAPI(title="Synapse Local API", version="0.2.0", lifespan=lifespan,
                          docs_url=None, redoc_url=None, openapi_url=None)
    router = APIRouter(dependencies=[Depends(require_session)])

    @application.exception_handler(ValueError)
    async def invalid_request(request, exc):
        return JSONResponse(status_code=400, content={"detail": str(exc)[:500]})

    @application.exception_handler(PermissionError)
    async def forbidden(request, exc):
        return JSONResponse(status_code=403, content={"detail": str(exc)})

    @application.exception_handler(RuntimeError)
    async def unavailable(request, exc):
        return JSONResponse(status_code=503, content={"detail": str(exc)[:500]})

    @application.exception_handler(KeyError)
    async def missing(request, exc):
        return JSONResponse(status_code=404, content={"detail": "Record not found"})

    @application.get("/health/live")
    def live():
        return {"status": "alive"}

    def services(request: Request):
        return request.app.state.services

    @router.get("/")
    def health(s: Services = Depends(services)):
        local = s.llm.status()
        return {"status": "Online", "memory_engine": s._memory.brain.hardware_mode if s._memory else "Not loaded",
                "generation_engine": "Ollama (local)", "orchestrator": s.storage.get("mode", "FOCUS"),
                "agents_active": [a["name"] for a in s.agents.get_all_agents()[:3]],
                "llm": local, "network_enabled": s.settings.network_enabled,
                "embeddings_loaded": s._memory is not None}

    @router.get("/health/ready")
    def ready(s: Services = Depends(services)):
        memory = s.memory
        llm = s.llm.status()
        return JSONResponse(status_code=200 if llm["ready"] else 503,
                            content={"ready": llm["ready"], "memory_engine": memory.brain.hardware_mode, "llm": llm})

    @router.get("/settings")
    def get_settings(s: Services = Depends(services)):
        return {**s.settings.model_dump(), "llm": s.llm.status()}

    @router.put("/settings")
    def save_settings(body: Settings, s: Services = Depends(services)):
        s.storage.set("settings", body.model_dump())
        s.storage.audit("settings", "updated")
        return body.model_dump()

    def ingest(s, filename, content, event=None):
        pages = FileIngester.parse_bytes(filename, content)
        memory = s.memory
        result = memory.ingest_document(filename, pages, cancel=event)
        return {"status": "success", "filename": filename, **result, "hardware": memory.brain.hardware_mode}

    async def read_upload(file):
        name = Path((file.filename or "").replace("\\", "/")).name
        try:
            content = await file.read(MAX_UPLOAD_BYTES + 1)
        finally:
            await file.close()
        if not name or len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(413, "Provide a named file smaller than 20 MB.")
        return name, content

    @router.post("/upload")
    async def upload(file: UploadFile = File(...), s: Services = Depends(services)):
        name, content = await read_upload(file)
        return await run_in_threadpool(ingest, s, name, content)

    @router.post("/ingestion/jobs", status_code=202)
    async def upload_job(file: UploadFile = File(...), s: Services = Depends(services)):
        name, content = await read_upload(file)
        return s.jobs.submit(lambda event: ingest(s, name, content, event))

    @router.get("/jobs/{identifier}")
    def get_job(identifier: str, s: Services = Depends(services)):
        job = s.jobs.get(identifier)
        if not job:
            raise HTTPException(404, "Import not found")
        return job

    @router.delete("/jobs/{identifier}")
    def cancel_job(identifier: str, s: Services = Depends(services)):
        return {"cancelled": s.jobs.cancel(identifier)}

    @router.get("/sources")
    def sources(s: Services = Depends(services)):
        return s.memory.get_sources()

    @router.get("/source")
    def source(name: str, s: Services = Depends(services)):
        return s.memory.source_chunks(name)

    @router.delete("/source")
    def remove_source(name: str, s: Services = Depends(services)):
        s.memory.delete_source(name)
        s.storage.audit("source.delete", "completed")
        return {"status": "success"}

    @router.delete("/sources/{source_name:path}")
    def remove_source_legacy(source_name: str, s: Services = Depends(services)):
        return remove_source(source_name, s)

    @router.get("/agents")
    def agents(s: Services = Depends(services)):
        return s.agents.get_all_agents()

    @router.get("/agents/{identifier}")
    def agent(identifier: int, s: Services = Depends(services)):
        return s.agent(identifier)

    @router.post("/agents", status_code=201)
    def create_agent(body: AgentCreate, s: Services = Depends(services)):
        return s.agents.add_agent(body.model_dump())

    @router.patch("/agents/{identifier}")
    def update_agent(identifier: int, body: AgentUpdate, s: Services = Depends(services)):
        updates = body.model_dump(exclude_none=True, exclude_unset=True)
        result = s.agents.update_agent(identifier, updates)
        if not result:
            raise HTTPException(404, "Agent not found")
        return result

    @router.delete("/agents/{identifier}")
    def delete_agent(identifier: int, s: Services = Depends(services)):
        if not s.agents.delete_agent(identifier):
            raise HTTPException(400, "Default agents cannot be deleted, or agent does not exist.")
        return {"status": "success"}

    @router.get("/conversations")
    def conversations(s: Services = Depends(services)):
        return s.storage.conversations()

    @router.post("/conversations", status_code=201)
    def new_conversation(s: Services = Depends(services)):
        return s.storage.new_conversation()

    @router.get("/conversations/{identifier}")
    def conversation(identifier: str, s: Services = Depends(services)):
        return s.storage.messages(identifier)

    @router.delete("/conversations/{identifier}")
    def delete_conversation(identifier: str, s: Services = Depends(services)):
        if not s.storage.delete_conversation(identifier):
            raise HTTPException(404, "Conversation not found")
        return {"status": "success"}

    def prepare_answer(query, s):
        agent = s.agent(query.agent_id)
        capabilities = agent.get("capabilities", {}) if agent else {}
        history = s.storage.messages(query.conversation_id) if query.conversation_id else []
        chosen = query.selected_sources or None
        restricted = agent.get("linked_sources") if agent else None
        if restricted:
            chosen = [source for source in restricted if chosen is None or source in chosen]
        # Add the previous question for short referential follow-ups.
        previous = next((m["content"] for m in reversed(history) if m["role"] == "user"), "")
        retrieval_query = query.text + ("\n" + previous[:1000] if previous and len(query.text.split()) < 12 else "")
        citations = s.memory.recall(retrieval_query, source_filters=chosen, max_distance=s.settings.retrieval_max_distance)
        used = []
        if query.allow_web:
            s.network()
            if not capabilities.get("web_search"):
                raise HTTPException(403, "Select an agent with web search enabled.")
            from ddgs import DDGS
            results = list(DDGS(timeout=15).text(query.text, max_results=3))
            citations.extend({"id": r["href"], "source": r["title"], "page": 1, "chunk": 1, "url": r["href"], "text": r["body"], "distance": 0} for r in results)
            used.append("web_search")
        context = "\n\n".join(f"[{i+1}] {c['source']} (page {c['page']})\n{c['text']}" for i, c in enumerate(citations))
        return agent, history, citations, context, used

    def answer_parts(query, s):
        if not s.chat_lock.acquire(blocking=False):
            raise HTTPException(409, "Another answer is in progress. Finish or cancel it first.")
        try:
            agent, history, citations, context, used = prepare_answer(query, s)
        except BaseException:
            s.chat_lock.release()
            raise

        def tokens():
            if not citations:
                yield "I couldn't find supporting information in the selected sources. Add a relevant document or choose a different source."
            else:
                yield from s.llm.stream_answer(context, query.text, agent.get("system_instruction") if agent else None, history)
        return citations, used, tokens()

    @router.post("/ask")
    def ask(query: Query, s: Services = Depends(services)):
        citations, used, tokens = answer_parts(query, s)
        try:
            answer = "".join(tokens)
            if query.conversation_id:
                s.storage.save_turn(query.conversation_id, query.text, answer, citations)
            return {"answer": answer, "sources": [c["source"] for c in citations], "citations": citations, "capabilities_used": used, "hardware_flow": s.memory.brain.hardware_mode + " ? Ollama (local)"}
        finally:
            tokens.close()
            s.chat_lock.release()

    @router.post("/ask/stream")
    async def ask_stream(query: Query, request: Request, s: Services = Depends(services)):
        citations, used, tokens = await run_in_threadpool(answer_parts, query, s)
        def event(kind, value):
            return "data: " + json.dumps({"type": kind, **value}) + "\n\n"
        async def events():
            parts = []
            try:
                yield event("sources", {"citations": citations})
                while True:
                    if await request.is_disconnected():
                        return
                    token = await run_in_threadpool(lambda: next(tokens, None))
                    if token is None:
                        break
                    parts.append(token)
                    yield event("token", {"text": token})
                if query.conversation_id:
                    await run_in_threadpool(s.storage.save_turn, query.conversation_id, query.text, "".join(parts), citations)
                yield event("done", {"capabilities_used": used})
            except Exception as exc:
                yield event("error", {"detail": str(exc)[:500]})
            finally:
                tokens.close()
                s.chat_lock.release()
        return StreamingResponse(events(), media_type="text/event-stream", headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"})

    @router.post("/tools/terminal")
    def diagnostic(body: TerminalRequest, s: Services = Depends(services)):
        selected = s.agent(body.agent_id)
        if not selected["capabilities"].get("terminal"):
            raise HTTPException(403, "This agent does not allow diagnostics.")
        result = terminal_tool.execute(body.command)
        s.storage.audit("diagnostic:" + body.command, "blocked" if result["blocked"] else "completed")
        return result

    @router.post("/tools/web-search")
    def search(body: SearchRequest, s: Services = Depends(services)):
        s.network()
        if not body.consent or not s.agent(body.agent_id)["capabilities"].get("web_search"):
            raise HTTPException(403, "Web search requires consent and an enabled agent.")
        from ddgs import DDGS
        results = list(DDGS(timeout=15).text(body.query, max_results=body.max_results))
        return {"results": results}

    @router.post("/actions/preview")
    def preview(body: ActionPreview, s: Services = Depends(services)):
        if body.action != "open_app":
            s.network()
        return s.actions.preview(body.action, body.params, s.agent(body.agent_id))

    @router.post("/actions/{identifier}/approve")
    def approve(identifier: str, s: Services = Depends(services)):
        return s.actions.approve(identifier, s.agents, s.settings.network_enabled)

    @router.delete("/actions/{identifier}")
    def cancel(identifier: str, s: Services = Depends(services)):
        return {"cancelled": s.actions.cancel(identifier)}

    @router.get("/audit")
    def audit(s: Services = Depends(services)):
        return s.storage.audit_log()

    @router.post("/set_mode")
    def set_mode(body: ModeRequest, s: Services = Depends(services)):
        s.storage.set("mode", body.mode)
        s.storage.audit("workflow:" + body.mode, "selected")
        return {"status": "success", "orchestrator_response": {"status": "selected", "current_mode": body.mode}, "hardware_used": "User preference",
                "message": "Workspace mode saved. Applications are opened through the Actions screen."}

    @router.get("/integrations/status")
    @router.get("/mcp/status")
    def integration_status(s: Services = Depends(services)):
        return s.integrations.status()

    @router.post("/integrations/{platform}/connect")
    def connect(platform: Platform, body: IntegrationConnect, s: Services = Depends(services)):
        s.network()
        result = s.integrations.connect(platform, **body.model_dump())
        s.storage.audit("integration.connect:" + platform, "completed")
        return {"status": "success", "platform": platform, **result}

    @router.delete("/integrations/{platform}")
    def disconnect(platform: Platform, s: Services = Depends(services)):
        s.integrations.disconnect(platform)
        s.storage.audit("integration.disconnect:" + platform, "completed")
        return {"status": "success"}

    def sync(s, platform, event):
        s.network()
        if not s.sync_lock.acquire(blocking=False):
            raise ValueError("Another sync is running. Wait for it to finish.")
        try:
            documents = s.integrations.documents(platform, event)
            memory = s.memory
            seen, count, changed = set(), 0, 0
            for document in documents:
                s.network()
                if event.is_set():
                    raise InterruptedError()
                seen.add(document["source"])
                result = memory.ingest_document(document["source"], [{"page": 1, "text": document["text"]}], document["url"], platform, event)
                count += result["chunks_processed"]
                changed += not result["unchanged"]
            # Reconcile deletion only after the complete scoped fetch succeeds.
            for source in memory.get_sources():
                if source.get("platform") == platform and source["name"] not in seen:
                    memory.delete_source(source["name"])
            s.integrations.mark_synced(platform)
            s.storage.audit("integration.sync:" + platform, "completed")
            return {"status": "success", "platform": platform, "documents_ingested": len(documents), "documents_changed": changed, "chunks_created": count, "hardware": memory.brain.hardware_mode}
        finally:
            s.sync_lock.release()

    @router.post("/integrations/{platform}/sync", status_code=202)
    def sync_job(platform: Platform, s: Services = Depends(services)):
        s.network()
        return s.jobs.submit(lambda event: sync(s, platform, event))

    def ingest_link(s, url, event):
        s.network()
        from .core.url_fetch import fetch_public_url
        from bs4 import BeautifulSoup
        final_url, html = fetch_public_url(url)
        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        if len(text) < 50:
            raise ValueError("Could not extract meaningful text from this page.")
        s.network()
        memory = s.memory
        result = memory.ingest_document(final_url, [{"page": 1, "text": text}], final_url, "web", event)
        return {"status": "success", "url": final_url, **result, "hardware": memory.brain.hardware_mode}

    @router.post("/ingest/url", status_code=202)
    def ingest_url(body: URLIngest, s: Services = Depends(services)):
        s.network()
        return s.jobs.submit(lambda event: ingest_link(s, body.url, event))

    @router.get("/meetings")
    def meetings(s: Services = Depends(services)):
        return s.storage.get("meetings", Meetings().model_dump())

    @router.post("/meetings")
    def save_meetings(body: Meetings, s: Services = Depends(services)):
        s.storage.set("meetings", body.model_dump())
        return {"status": "success"}

    application.include_router(router)
    return application


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000)
