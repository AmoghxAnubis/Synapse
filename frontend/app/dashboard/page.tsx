"use client";

import { Brain, ArrowLeft } from "lucide-react";
import Link from "next/link";
import HardwareStatusBanner from "@/components/HardwareStatusBanner";
import MemoryDropzone from "@/components/MemoryDropzone";
import ChatInterface from "@/components/ChatInterface";
import OrchestratorDock from "@/components/OrchestratorDock";

export default function Dashboard() {
    return (
        <div className="relative min-h-screen bg-white">
            {/* Subtle grid background */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)",
                    backgroundSize: "64px 64px",
                }}
            />

            {/* Top status banner */}
            <HardwareStatusBanner />

            {/* Main content grid */}
            <main className="relative mx-auto flex h-screen max-w-7xl gap-6 px-6 pt-[72px] pb-28">
                {/* Left sidebar — Memory Dropzone */}
                <aside className="w-72 shrink-0 pt-4">
                    <MemoryDropzone />
                </aside>

                {/* Center — Chat Interface */}
                <section className="flex-1 min-w-0 pt-4">
                    <ChatInterface />
                </section>
            </main>

            {/* Bottom dock — Orchestrator */}
            <OrchestratorDock />
        </div>
    );
}
