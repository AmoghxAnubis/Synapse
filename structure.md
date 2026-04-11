# 🧠 Synapse

Synapse is a modular, agent-driven AI system designed to orchestrate intelligent workflows across multiple tools, integrations, and memory systems.

This README focuses on understanding the **project structure and architecture**.

---

## 📁 Project Structure

```
synapse/
│
├── backend/                 # Core AI + orchestration system
├── frontend/                # Next.js UI for interacting with Synapse
├── synapse_memory_db/       # Persistent vector memory (ChromaDB)
│
├── context.md              # Context and design notes
├── TODO.md                 # Pending tasks
└── README.md               # Project documentation
```

---

## ⚙️ Backend Architecture (`/backend`)

```
backend/
│
├── app/
│   ├── main.py             # Entry point of backend server
│   ├── __init__.py
│   │
│   ├── agents/             # Agent system (core intelligence layer)
│   │   ├── agent_manager.py
│   │   ├── agent_manager_new.py
│   │   └── tools/          # Tool integrations for agents
│   │       ├── github_tool.py
│   │       ├── jira_tool.py
│   │       ├── notion_tool.py
│   │       ├── app_launcher.py
│   │       ├── mcp_client.py
│   │       ├── mcp_*_server.py   # MCP-based integrations (GitHub, Slack, Notion, etc.)
│   │
│   ├── core/               # Core system logic
│   │   ├── orchestrator.py # Central brain (routes tasks between agents/tools)
│   │   ├── llm.py          # LLM interaction layer
│   │   ├── memory.py       # Memory abstraction (vector DB handling)
│   │   ├── ingester.py     # Data ingestion pipeline
│   │   └── amd_bridge.py   # External/system bridge layer
│
├── synapse_memory_db/      # Local vector database (Chroma)
│
├── requirements.txt        # Python dependencies
├── test_mcp.py            # MCP integration tests
└── test_notion.py         # Notion integration tests
```

### 🧠 Backend Overview

* **Agents Layer** → Handles intelligent decision-making
* **Tools Layer** → External integrations (GitHub, Notion, Slack, Jira)
* **Orchestrator** → Routes tasks between agents and tools
* **Memory System** → Stores embeddings + context using ChromaDB
* **LLM Layer** → Handles all AI reasoning

---

## 🎨 Frontend Architecture (`/frontend`)

```
frontend/
│
├── app/                   # Next.js App Router structure
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Global layout
│   │
│   ├── dashboard/         # Main application dashboard
│   │   ├── agents/
│   │   ├── knowledge/
│   │   ├── meetings/
│   │   ├── research/
│   │   └── settings/
│   │
│   ├── sign-in/           # Authentication صفحات
│   └── sign-up/
│
├── components/            # Reusable UI components
│   ├── ChatInterface.tsx  # Core chat system
│   ├── ChatInput.tsx
│   ├── Sidebar.tsx
│   ├── Navbar.tsx
│   ├── IntegrationCard.tsx
│   ├── MemoryDropzone.tsx
│   │
│   ├── Landing/           # Landing page components
│   ├── Footer/            # Footer visuals + interactions
│   └── ui/                # Design system components
│
├── lib/                   # Utility functions + API handlers
│   ├── api.ts
│   └── utils.ts
│
├── public/                # Static assets
│
├── package.json
└── next.config.ts
```

### 🎯 Frontend Overview

* Built with **Next.js (App Router)**
* Modular dashboard with feature-specific sections:

  * Agents
  * Knowledge
  * Meetings
  * Research
* Component-driven UI system
* Integrated chat interface for interacting with Synapse

---

## 🧠 Memory System (`/synapse_memory_db`)

```
synapse_memory_db/
├── chroma.sqlite3
└── <vector-index-files>
```

* Uses **ChromaDB** for persistent vector storage
* Stores:

  * Context embeddings
  * User interactions
  * Knowledge base data

---

## 🔗 System Flow (High-Level)

1. User interacts via **Frontend (Chat/UI)**
2. Request goes to **Backend API**
3. **Orchestrator** determines action
4. **Agents** decide strategy
5. **Tools** execute external operations (GitHub, Notion, etc.)
6. Results stored in **Memory (ChromaDB)**
7. Response returned to user

---

## 🧩 Key Design Principles

* **Modular Agents**
* **Tool-based Execution**
* **Central Orchestration**
* **Persistent Memory**
* **Scalable Integrations**

---

## 🚀 Summary

Synapse is structured as a **multi-agent AI system** with:

* A **React/Next.js frontend**
* A **Python-based orchestration backend**
* A **persistent vector memory layer**
* A growing ecosystem of **tool integrations**

---

## 🛠️ Future Expansion Areas

* More agent specialization
* Real-time collaboration
* Advanced memory retrieval
* Autonomous workflows

---
