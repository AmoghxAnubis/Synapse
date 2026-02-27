# 🧠 Synapse OS Integrations 

Synapse is a local-first, privacy-centric AI OS assistant. Built to run primarily on local neural processing hardware (AMD Ryzen AI NPUs / simulated GPU clusters via Ollama), Synapse acts as "The Eyes, Voice, and Hands" of your machine.

This repository encompasses both the **Next.js Frontend UI** and the **FastAPI + ChromaDB Backend Core**, forming a complete RAG-powered, agentic desktop companion.

## 🚀 Core Philosophy & Features

The overarching architecture is governed by a strict **"Pull Down to Local"** philosophy.

*   **Zero Cloud Leakage:** All document processing, vector embeddings, and language generation (via Llama 3) happen completely disconnected from the cloud. Your data never leaves your OS.
*   **The Brain (Local Memory):** Utilizes `ChromaDB` for persistent semantic vector storage of documents, logs, and external workspace context.
*   **The Eyes (Ingestion):** Drag-and-drop document parsers (PDF, text) combined with an expanding suite of external SaaS connections (GitHub, Slack, Notion, Jira) to constantly feed the memory bank.
*   **The Voice (RAG Chat):** A sleek "Evalis-inspired" interaction interface built on Next.js, Framer Motion, and Tailwind CSS.
*   **The Hands (Orchestrator):** Autonomic agents capable of executing local OS-level commands (like window tiling, opening apps, or silencing notifications) mapped to specific workflow mental states (Focus, Meeting, Research).

## 🛠 Tech Stack

**Frontend (`/frontend`)**
*   **Framework:** Next.js 16 (React 19) w/ App Router 
*   **Styling:** Tailwind CSS v4 + `shadcn/ui`
*   **Animations:** Framer Motion & `tw-animate-css`
*   **Visuals:** Native aesthetic, glassmorphism arrays, dark/light high-contrast modes

**Backend (`/backend`)**
*   **Runtime:** Python 3.11+
*   **Framework:** FastAPI
*   **AI Models:** Ollama (Llama 3 generation), HuggingFace embeddings (`all-MiniLM-L6-v2`)
*   **Database:** Local ChromaDB instance

## ⚙️ Getting Started

To run Synapse locally, you must spin up both the frontend and the backend services.

### 1. Start the Backend API (FastAPI)

Ensure you have a local instance of [Ollama](https://ollama.com/) running and that you have pulled the required model:
```bash
ollama run llama3
```

Navigate to the `backend` folder, install requirements, and start the Uvicorn server:
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate 
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python -m app.main
```
The Backend API will spool up at `http://localhost:8000`.

### 2. Start the Frontend UI (Next.js)

Open a new terminal, navigate to the `frontend` folder, install packages, and boot the dev server.
```bash
cd frontend
npm install
npm run dev
```
The Synapse Dashboard will be accessible at `http://localhost:3000`.

## 🔋 Connecting External "Brains"

Synapse supports an *External Integrations Module* that allows you to sync contextual data directly into your ChromaDB vector cache.

Navigate to **Settings -> Integrations** (`/settings/integrations`) in the UI to connect:
*   **GitHub:** Sync Repositories & Pull Requests
*   **Slack:** Sync Saved Messages & Channel Context
*   **Notion:** Sync Workspace Docs & Notes
*   **Jira:** Sync Active Sprint Tickets

*(See `/context.md` and `/frontend/design.md` for extended architectural details).*
