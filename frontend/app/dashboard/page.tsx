"use client";

import ChatInterface from "@/components/ChatInterface";
import OrchestratorDock from "@/components/OrchestratorDock";

export default function Dashboard() {
    return (
        <div className="flex h-full flex-col relative">
            {/* Subtle grid background */}
            <div
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)",
                    backgroundSize: "64px 64px",
                }}
            />

            {/* Page Header (Breadcrumb Style) */}
            <header className="mb-6 flex items-center justify-between relative z-10">
                <nav className="text-sm text-neutral-500 font-medium">
                    <span className="hover:text-neutral-800 cursor-pointer dark:text-neutral-400 dark:hover:text-neutral-200">
                        Synapse
                    </span>
                    <span className="mx-2">/</span>
                    <span className="text-neutral-900 dark:text-neutral-100">
                        Chat & Orchestrator
                    </span>
                </nav>
            </header>

            {/* Main Center Area */}
            <div className="flex-1 min-h-0 relative z-10 w-full max-w-4xl mx-auto pb-28">
                <ChatInterface />
            </div>

            {/* Bottom Orchestrator Dock */}
            <div className="relative z-20">
                <OrchestratorDock />
            </div>
        </div>
    );
}
