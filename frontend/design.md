📂 Synapse OS Assistant: Frontend Design & Implementation Document
Target AI Engine: Google Antigravity (Planning Mode)
Architecture: Next.js (App Router), Tailwind CSS, shadcn/ui, Framer Motion
Design Aesthetic: "Evalis-inspired" (Premium SaaS, Dark/Light High Contrast, Glassmorphism, Subtle Gradients)

1. Project Overview & Aesthetic Guidelines
Synapse is a local-first, privacy-centric AI OS assistant. The frontend must feel like a native, premium system tool.

Visual Identity (Evalis-Inspired):

Theme: Deep dark mode default with a clean, high-contrast light mode alternative.

Colors: Deep background (#09090B or similar neutral black), with vibrant gradient accents for hardware status (e.g., Emerald for NPU Active, Purple for GPU, Blue for CPU Fallback).

Typography: Clean geometric sans-serif (Inter or Geist) for high legibility.

Surfaces: Use "Glassmorphism" for floating panels. Cards should have slight translucency (backdrop blur) and subtle 1px borders (border-white/10).

Animations: Use Framer Motion for buttery-smooth micro-interactions. Swapping between orchestrator modes must trigger a soft color tint transition across the UI.

2. Tech Stack & Dependencies
Framework: Next.js (React)

Styling: Tailwind CSS

UI Components: shadcn/ui (Buttons, Cards, Badges, Inputs, ScrollArea, Toasts)

Icons: Lucide React

State Management: React Hooks (useState, useContext for global hardware/mode state)

Network: axios or native fetch mapped to localhost:8000

3. Core UI Layout & Component Architecture
A. The System Header (Hardware & Orchestrator Status)
Visuals: A sleek, pill-shaped sticky banner at the top.

Elements:

Backend Status: Pings http://localhost:8000/. Displays "Synapse Online".

Hardware Badge: Dynamic glowing dot. Shows current hardware mode (e.g., NPU vs GPU vs CPU_MOCK).

LLM Status: Displays Ollama connection status.

B. Left Sidebar: "The Eyes" (Memory Ingestion Dropzone)
Function: Drag-and-drop file uploader triggering the /upload API endpoint.

Visuals: A dashed-border area with hover states that glow when a file is dragged over.

Feedback: When a file uploads, display a success toast showing the filename and chunks_processed. Include a minimalist list of recently ingested files below it.

C. Center Panel: "The Voice" (RAG Chat Interface)
Function: The primary interaction zone. Sends user strings to the /ask endpoint.

Visuals:

Message Bubbles: User messages are solid accent color, AI messages are glassmorphic dark gray.

Source Attributions: Beneath the AI response, render an elegant, collapsible <Accordion> or <Badge> array displaying the exact sources (ChromaDB chunks) returned by the backend.

D. Floating Bottom Dock: "The Hands" (Orchestrator Controls)
Function: Triggers the /set_mode endpoint to control OS behavior.

Visuals: A macOS-style floating dock or segmented control panel centered at the bottom.

Modes: Three distinct, animated buttons:

🎯 FOCUS (Silences notifications)

📅 MEETING (Opens notepad/tools)

🔍 RESEARCH (Opens browser/calc).

4. Antigravity Agent Execution Plan (Tasks)
When you paste this into Antigravity, tell the agent to execute these steps sequentially.

Task 1: Project Scaffolding.

Initialize a Next.js App Router project with TypeScript and Tailwind CSS.

Run the initialization command for shadcn/ui and install base components: button, card, badge, input, scroll-area, toast.

Install framer-motion, lucide-react, and axios.

Task 2: Theming & Global CSS.

Update globals.css and tailwind.config.ts to implement the "Evalis" dark mode style (deep blacks #09090B, glassmorphism utilities bg-white/5 backdrop-blur-md, and custom gradient utility classes).

Task 3: API Service Layer.

Create a lib/api.ts file containing typed Axios functions pointing to http://localhost:8000.

Create functions: checkHealth(), uploadDocument(file), askSynapse(query), and setOrchestratorMode(mode).

Task 4: Component Construction.

Build HardwareStatusBanner.tsx.

Build MemoryDropzone.tsx (using standard HTML5 drag-and-drop or react-dropzone).

Build ChatInterface.tsx (with auto-scroll to bottom and source chunk rendering).

Build OrchestratorDock.tsx (with Framer Motion tap/hover animations).

Task 5: Main Dashboard Layout.

Assemble all components in app/page.tsx utilizing a CSS Grid or Flexbox layout that ensures the dropzone is on the left, chat in the center, and dock floating at the bottom.