"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Cpu, Zap, Brain, Wifi, WifiOff, ArrowLeft, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { checkHealth, type HealthResponse } from "@/lib/api";
import Link from "next/link";

const hardwareConfig: Record<string, { bg: string; text: string; ring: string; icon: React.ReactNode }> = {
    NPU: {
        bg: "bg-emerald-50 dark:bg-emerald-950/50",
        text: "text-emerald-700 dark:text-emerald-400",
        ring: "ring-emerald-200 dark:ring-emerald-800",
        icon: <Zap className="h-3 w-3" />,
    },
    GPU: {
        bg: "bg-purple-50 dark:bg-purple-950/50",
        text: "text-purple-700 dark:text-purple-400",
        ring: "ring-purple-200 dark:ring-purple-800",
        icon: <Cpu className="h-3 w-3" />,
    },
    CPU_MOCK: {
        bg: "bg-blue-50 dark:bg-blue-950/50",
        text: "text-blue-700 dark:text-blue-400",
        ring: "ring-blue-200 dark:ring-blue-800",
        icon: <Cpu className="h-3 w-3" />,
    },
};

export default function HardwareStatusBanner() {
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [online, setOnline] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

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
        <>
            {/* Invisible hover zone to trigger the banner */}
            <div
                className="fixed inset-x-0 top-0 z-[60] h-6"
                onMouseEnter={() => setIsHovered(true)}
            />

            <motion.header
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                initial={{ y: "-100%" }}
                animate={{ y: isHovered ? 0 : "-100%" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-zinc-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 px-6 py-3 backdrop-blur-xl shadow-sm"
            >
                {/* Handle to pull down / indicate presence */}
                <div
                    className="absolute -bottom-4 left-1/2 flex h-4 w-16 -translate-x-1/2 items-center justify-center rounded-b-lg border border-t-0 border-zinc-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-neutral-800 transition-colors"
                >
                    <div className="h-1 w-6 rounded-full bg-zinc-300 dark:bg-neutral-600" />
                </div>

                {/* Left — back + logo */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-neutral-100 transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Home
                    </Link>
                    <div className="h-4 w-px bg-zinc-200 dark:bg-neutral-800" />
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 dark:bg-neutral-100">
                            <Brain className="h-3.5 w-3.5 text-white dark:text-neutral-900" />
                        </div>
                        <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-neutral-100">Dashboard</span>
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
                        <span className="text-xs font-medium text-zinc-600 dark:text-neutral-400">
                            {online ? "Online" : "Offline"}
                        </span>
                    </div>

                    <div className="h-4 w-px bg-zinc-200 dark:bg-neutral-800" />

                    {/* Hardware badge */}
                    <Badge
                        variant="secondary"
                        className={`flex items-center gap-1.5 border text-xs font-semibold ${config.bg} ${config.text} ${config.ring} ring-1`}
                    >
                        <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-zinc-500"}`} />
                        {config.icon}
                        {hw}
                    </Badge>

                    <div className="h-4 w-px bg-zinc-200 dark:bg-neutral-800" />

                    {/* LLM Status */}
                    <div className="flex items-center gap-1.5">
                        {online ? (
                            <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                            <WifiOff className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                        )}
                        <span className="text-xs text-zinc-600 dark:text-neutral-400">
                            {health?.generation_engine ?? "LLM Disconnected"}
                        </span>
                    </div>

                    <div className="h-4 w-px bg-zinc-200 dark:bg-neutral-800" />

                    {/* Orchestrator mode */}
                    <div className="flex items-center gap-1.5">
                        <Brain className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-medium text-zinc-600 dark:text-neutral-400">
                            {health?.orchestrator ?? "—"}
                        </span>
                    </div>

                    <Activity className="ml-1 h-3.5 w-3.5 animate-pulse text-emerald-600 dark:text-emerald-400" />

                    <div className="h-4 w-px bg-zinc-200 dark:bg-neutral-800" />

                    <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-neutral-100 transition-colors"
                        title="Settings"
                    >
                        <Settings className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </motion.header>
        </>
    );
}
    );
}
