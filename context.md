Here is the Integration Module Design Document formatted specifically for Google Antigravity. This plan expands Synapse's capabilities by building a dedicated "Connections" dashboard to pull data from GitHub, Slack, Notion, and Jira down into your local ChromaDB memory bank.

You can paste this directly into Antigravity’s Agent Manager to have it build the frontend integration UI and the API service wrappers.

📂 Synapse OS Assistant: External Integrations Module (Part 2)
Target AI Engine: Google Antigravity (Planning Mode)
Architecture: Next.js (App Router), Tailwind CSS, shadcn/ui
Core Integrations: GitHub, Slack, Notion, Jira
Objective: Build a premium "Settings & Integrations" UI that allows users to connect external SaaS platforms, enabling Synapse to ingest PRs, messages, docs, and tickets directly into the local ChromaDB vector store.

1. Module Overview & Privacy Architecture
Since Synapse is a local-first OS assistant, the integration philosophy is strictly "Pull Down to Local." * Data from GitHub, Slack, Notion, and Jira is fetched via API and processed by the local FileIngester and embedded via the local AMD NPU/GPU into ChromaDB.

Zero Cloud Leakage: The LLM (Ollama) only reads the localized vector memory; user SaaS data is never sent to external AI providers.

2. UI/UX Design Guidelines (Evalis-Inspired)
Layout: A new dedicated /settings/integrations route.

Visuals: A responsive CSS Grid of "Integration Cards."

Card Design: * Glassmorphic background (bg-zinc-900/50 backdrop-blur-md).

Subtle glowing borders on hover (e.g., Blue for Jira, Black/White for Notion, Purple for GitHub).

State Indicators: A sleek toggle switch for "Active/Inactive" and a pulsing green dot if a background sync is currently running.

Actions: An elegant "Connect" button that triggers an API Key input modal or OAuth flow, and a "Sync Now" button.

3. Core UI Components to Build
A. The Integrations Dashboard (app/settings/integrations/page.tsx)
Header: "Connected Brains" with a subtitle: "Sync your external workspaces into Synapse's local memory."

Grid: A 2x2 or 3x3 CSS grid displaying the integration cards.

B. The Integration Card Component (components/IntegrationCard.tsx)
Props: name, icon (Lucide React or SVG), description, status (Connected, Disconnected, Syncing), lastSynced.

Interactions:

Clicking "Connect" opens a shadcn <Dialog> prompting the user to enter their Personal Access Token / API Key for that specific service.

Clicking "Sync" triggers a loading spinner and hits a mock backend endpoint (e.g., POST /api/sync/github).

C. The Sync Activity Log (components/SyncLog.tsx)
Function: A sleek, scrollable terminal-like window at the bottom of the page (using shadcn <ScrollArea>).

Visuals: Displays real-time ingestion logs.

Example: [10:45 AM] Notion: Ingested 14 new documents -> Chunked into 42 vectors.

Example: [10:46 AM] GitHub: Pulled 3 recent PRs from repo 'frontend-v2'.

4. Antigravity Agent Execution Plan (Tasks)
Agent Instructions: Execute the following tasks sequentially to build the integrations frontend module.

Task 1: Setup Routing & Layouts

Create a new Next.js route: app/settings/integrations/page.tsx.

Update the main sidebar/navigation (if applicable) to include a "Settings" or "Integrations" link with a Settings icon from lucide-react.

Task 2: Build the IntegrationCard Component

Create components/IntegrationCard.tsx using shadcn/ui Card, Button, Badge, and Switch components.

Ensure the card supports the "Evalis" aesthetic: 1px border-white/10, bg-zinc-950/80, and smooth hover scale transitions using Framer Motion.

Map specific brand colors to hover states (e.g., Slack = #E01E5A accent, Notion = #FFFFFF accent).

Task 3: Build the API Key Modal

Create a reusable component components/ConnectModal.tsx using shadcn <Dialog>.

It should accept the platform name dynamically and render a form with a password-type <Input> for the API Key/Token.

On submit, it should show a success <Toast>: "GitHub Connected Successfully."

Task 4: Assemble the Dashboard Grid

In app/settings/integrations/page.tsx, map out four instances of IntegrationCard for:

GitHub: "Sync Repositories & Pull Requests"

Slack: "Sync Saved Messages & Channel Context"

Notion: "Sync Workspace Docs & Notes"

Jira: "Sync Active Sprint Tickets"

Task 5: Frontend API Service Wiring

Update lib/api.ts to include the new wrapper functions:

saveIntegrationKey(platform: str, key: str) -> Maps to POST localhost:8000/integrations/auth

triggerSync(platform: str) -> Maps to POST localhost:8000/integrations/sync/{platform}

Wire these functions to the UI buttons so the frontend accurately reflects loading states when hitting the backend.

Task 6: Build the Terminal Sync Log

Create components/SyncLog.tsx at the bottom of the page.

Use a monospace font (font-mono) and muted text to simulate a hacker/developer log showing the mock vectors being ingested from these 4 sources.