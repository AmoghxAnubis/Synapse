"use client";

import HardwareStatusBanner from "@/components/HardwareStatusBanner";
import MemoryDropzone from "@/components/MemoryDropzone";
import ChatInterface from "@/components/ChatInterface";
import OrchestratorDock from "@/components/OrchestratorDock";

export default function Dashboard() {
    return (
        <div className="dark relative min-h-screen bg-[#09090B]">
            {/* Top status banner */}
            <HardwareStatusBanner />

            {/* Main content grid */}
            <main className="mx-auto flex h-screen max-w-7xl gap-5 px-5 pt-20 pb-28">
                {/* Left sidebar — Memory Dropzone */}
                <aside className="w-72 shrink-0">
                    <MemoryDropzone />
                </aside>

                {/* Center — Chat Interface */}
                <section className="flex-1 min-w-0">
                    <ChatInterface />
                </section>
            </main>

            {/* Bottom dock — Orchestrator */}
            <OrchestratorDock />
        </div>
    );
}
