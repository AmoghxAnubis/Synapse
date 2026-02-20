"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Cpu, Zap, Brain, Wifi, WifiOff, ArrowLeft, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { checkHealth, type HealthResponse } from "@/lib/api";
import Link from "next/link";

const hardwareConfig: Record<string, { bg: string; text: string; ring: string; icon: React.ReactNode }> = {
    NPU: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        ring: "ring-emerald-200",
        icon: <Zap className="h-3 w-3" />,
    },
    GPU: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        ring: "ring-purple-200",
        icon: <Cpu className="h-3 w-3" />,
    },
    CPU_MOCK: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        ring: "ring-blue-200",
        icon: <Cpu className="h-3 w-3" />,
    },
};

export default function HardwareStatusBanner() {
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [online, setOnline] = useState(false);

    useEffect(() => {
        const poll = async () => {
            try {
                const data = await checkHealth();
                setHealth(data);
                setOnline(true);
            } catch {
                setOnline(false);
                setHealth(null);
            }
        };

        poll();
        const interval = setInterval(poll, 10_000);
        return () => clearInterval(interval);
    }, []);

    const hw = health?.memory_engine ?? "CPU_MOCK";
    const config = hardwareConfig[hw] ?? hardwareConfig.CPU_MOCK;

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-6 py-3 backdrop-blur-xl"
        >
            {/* Left — back + logo */}
            <div className="flex items-center gap-4">
                <Link
                    href="/"
                    className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-foreground"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Home
                </Link>
                <div className="h-4 w-px bg-zinc-200" />
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
                        <Brain className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold tracking-tight">Dashboard</span>
                </div>
            </div>

            {/* Right — status indicators */}
            <div className="flex items-center gap-3">
                {/* Backend status */}
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span
                            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${online ? "bg-emerald-500" : "bg-red-400"
                                }`}
                        />
                        <span
                            className={`relative inline-flex h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-red-400"
                                }`}
                        />
                    </span>
                    <span className="text-xs font-medium text-zinc-600">
                        {online ? "Online" : "Offline"}
                    </span>
                </div>

                <div className="h-4 w-px bg-zinc-200" />

                {/* Hardware badge */}
                <Badge
                    variant="secondary"
                    className={`flex items-center gap-1.5 border text-xs font-semibold ${config.bg} ${config.text} ${config.ring} ring-1`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-zinc-400"}`} />
                    {config.icon}
                    {hw}
                </Badge>

                <div className="h-4 w-px bg-zinc-200" />

                {/* LLM Status */}
                <div className="flex items-center gap-1.5">
                    {online ? (
                        <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                        <WifiOff className="h-3.5 w-3.5 text-red-400" />
                    )}
                    <span className="text-xs text-zinc-600">
                        {health?.generation_engine ?? "LLM Disconnected"}
                    </span>
                </div>

                <div className="h-4 w-px bg-zinc-200" />

                {/* Orchestrator mode */}
                <div className="flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-purple-600" />
                    <span className="text-xs font-medium text-zinc-600">
                        {health?.orchestrator ?? "—"}
                    </span>
                </div>

                <Activity className="ml-1 h-3.5 w-3.5 animate-pulse text-emerald-600" />

                <div className="h-4 w-px bg-zinc-200" />

                <Link
                    href="/settings/integrations"
                    className="flex items-center gap-1.5 text-zinc-500 transition hover:text-foreground"
                    title="Integrations"
                >
                    <Settings className="h-3.5 w-3.5" />
                </Link>
            </div>
        </motion.header>
    );
}
