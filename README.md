# Synapse AI - Local-First Agent Orchestrator & OS Assistant
[![Status](https://img.shields.io/badge/Status-Online-brightgreen)](http://localhost:8000/)

**Synapse** is a privacy-centric, hardware-accelerated AI platform that bridges **local RAG memory** (ChromaDB + Ollama/Llama3) with **external tool integrations** via custom **MCP (Model Context Protocol) servers**. Think: Zero-knowledge personal AI that routes your natural language queries to GitHub/Notion/Jira/Slack/Discord or ingests your local files for instant semantic search.

## 🎯 What It Does
- **Local-First RAG**: Upload PDFs/docs → Chunk → Embed (AMD NPU sim) → Query with Ollama.
- **Agentic Routing**: Keyword detection routes to MCP tools (e.g., \"create GitHub PR\" → MCP GitHub Server).
- **OS Orchestration**: Workflow modes (Focus/Meeting/Research) via `/set_mode`.
- **Dashboard**: Next.js UI for chat, file dropzone, integrations sync, agent/knowledge views.
- **Hardware Flow**: NPU (routing) → GPU (inference) → CPU fallback (simulated).

```
User Query ─┬→ AgentManager.route_request() ─→ MCP Server (GitHub/Jira/etc.) ─→ API Call → Formatted Result
            │
            └→ Chroma.recall() → Ollama.generate() → Answer + Sources
```

## 🏗️ Architecture

```
Frontend (Next.js 16)          Backend (FastAPI)             External
  │                               │                             │
Dashboard/Chat ─── /ask ───→ AgentManager ───┐                MCP Servers
File Drop ─── /upload ───→ MemoryBank       │  (requests + Tokens)
Orchestrator ── /set_mode ─→ Orchestrator   └──→ GitHub/Notion/Jira/Slack/Discord
                                          │
                                       ChromaDB (synapse_memory_db/)
                                       Ollama (llama3)
```

### Core Components
| Module | Path | Role |
|--------|------|------|
| **MemoryBank** | `app/core/memory.py` | Chroma vector store + embeddings |
| **LocalLLM** | `app/core/llm.py` | Ollama integration |
| **FileIngester** | `app/core/ingester.py` | PDF/text parsing + chunking |
| **AgentManager** | `app/agents/agent_manager.py` | Deterministic routing to MCP |
| **Orchestrator** | `app/core/orchestrator.py` | OS workflow modes |
| **MCPComboClient** | `app/agents/tools/mcp_combo_client.py` | Unified natlang → tool exec |

## 🤖 Agent Routing Table
AgentManager uses **keyword intent detection** (NPU-simulated):

| Keywords | Tool | MCP Server | Example Query |
|----------|------|------------|---------------|
| `slack message/channel/dm` | Slack | `mcp_slack_server.py` | \"Send Slack message to #general: Hello team\" |
| `discord message/channel` | Discord | `mcp_discord_server.py` | \"Post to Discord #dev: Update deployed\" |
| `jira issue/ticket/project` | Jira | `mcp_jira_server.py` | \"Create Jira ticket in PROJ-123: Fix bug\" |
| `notion page/database` | Notion | `mcp_notion_server.py` | \"Search Notion database for Q3 roadmap\" |
| `github/pr/issue/branch` | GitHub | `mcp_github_server.py` | \"Create PR in myrepo/feature-branch\" |
| `open [app]` | AppLauncher | `app_launcher.py` | \"Open Chrome\" |
| Fallback | Local RAG | Memory + LLM | \"Summarize my meeting notes\" |

**MCP Protocol**: Servers expose `execute(natlang_query)` → Parse intent → Auth API call → Return formatted JSON.

## 🔌 Integrations Setup
Copy `.env.example` → `.env` (backend/):
```
GITHUB_TOKEN=ghp_xxx
NOTION_TOKEN=secret_xxx
JIRA_SERVER=https://your-site.atlassian.net
JIRA_EMAIL=user@ex.com
JIRA_TOKEN=xxx
SLACK_TOKEN=xoxb-xxx
DISCORD_TOKEN=Bot_xxx
```

Frontend: `/dashboard/settings/integrations` → Connect (Clerk auth + API sync).

## 📱 Frontend Dashboard
- **Next.js 16 App Router** (`frontend/`)
- **Pages**: `/dashboard/agents`, `/knowledge`, `/meetings`, `/research`, `/settings/integrations`
- **Style**: shadcn/ui + Tailwind + Framer Motion (glassmorphism, dark theme)
- **Key Components**: `ChatInterface.tsx`, `MemoryDropzone.tsx`, `IntegrationCard.tsx`

## 🚀 Quick Start
```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your tokens!
uvicorn app.main:app --reload  # http://localhost:8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev  # http://localhost:3000
```

**Test Flow**:
1. Upload doc via dropzone → Check `/` health (chunks ingested).
2. Query: \"What's in my doc?\" → RAG response + sources.
3. Query: \"Create GitHub issue\" → Routed to MCP GitHub.

## 🛠️ Development (For AIs like BLACKBOXAI)
- **Iterate**: `read_file backend/app/main.py` → Analyze → `edit_file` or `create_file`.
- **Search**: `search_files . "agent|memory|MCP" "*.py"` for patterns.
- **Test MCP**: Set token → `\"send slack message\"` → Check agent_manager.py routing.
- **VSCode**: Open tabs show active files (e.g., mcp_*.py for integrations).

## 🔮 Hardware/Orchestrator Modes
- **NPU**: Intent routing (AgentManager).
- **GPU**: Embeddings/inference (ROCm sim).
- **Modes** (`/set_mode`): `focus` (silence notifs), `meeting` (tools), `research` (browser/calc).

## 📊 APIs
| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/` | GET | - | `{status, memory_engine: 'NPU', ...}` |
| `/upload` | POST | file | `{chunks_processed: 5, hardware: 'NPU'}` |
| `/ask` | POST | `{text: 'query'}` | `{answer, sources, hardware_flow}` |
| `/set_mode` | POST | `{mode: 'research'}` | `{status: 'success'}` |

## 🚀 Next Steps / Open Tasks
See `TODO.md` (e.g., Discord MCP polish). Contributions: Add MCP servers (Linear/Email/etc.).

**Synapse: Your local brain that talks to the world. No data leaves your machine unless you say so.**

---
*Built with ❤️ for AI agents. Last updated: Auto-generated by BLACKBOXAI.*

