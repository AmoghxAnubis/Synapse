"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Cpu, Zap, Brain, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { checkHealth, type HealthResponse } from "@/lib/api";

const hardwareConfig: Record<string, { color: string; glow: string; icon: React.ReactNode }> = {
    NPU: {
        color: "bg-synapse-npu",
        glow: "glow-npu",
        icon: <Zap className="h-3 w-3" />,
    },
    GPU: {
        color: "bg-synapse-gpu",
        glow: "glow-gpu",
        icon: <Cpu className="h-3 w-3" />,
    },
    CPU_MOCK: {
        color: "bg-synapse-cpu",
        glow: "glow-cpu",
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
            className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
        >
            <div className="glass-strong flex items-center gap-3 rounded-full px-5 py-2.5 shadow-2xl">
                {/* Backend status */}
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span
                            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${online ? "bg-synapse-online" : "bg-synapse-offline"
                                }`}
                        />
                        <span
                            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${online ? "bg-synapse-online" : "bg-synapse-offline"
                                }`}
                        />
                    </span>
                    <span className="text-xs font-medium text-foreground/80">
                        {online ? "Synapse Online" : "Offline"}
                    </span>
                </div>

                <div className="h-4 w-px bg-white/10" />

                {/* Hardware badge */}
                <Badge
                    variant="secondary"
                    className={`flex items-center gap-1.5 text-xs font-semibold ${config.glow} border-0`}
                >
                    <span className={`h-2 w-2 rounded-full ${config.color}`} />
                    {config.icon}
                    {hw}
                </Badge>

                <div className="h-4 w-px bg-white/10" />

                {/* LLM Status */}
                <div className="flex items-center gap-1.5">
                    {online ? (
                        <Wifi className="h-3.5 w-3.5 text-synapse-online" />
                    ) : (
                        <WifiOff className="h-3.5 w-3.5 text-synapse-offline" />
                    )}
                    <span className="text-xs text-muted-foreground">
                        {health?.generation_engine ?? "LLM Disconnected"}
                    </span>
                </div>

                <div className="h-4 w-px bg-white/10" />

                {/* Orchestrator mode */}
                <div className="flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-synapse-gpu" />
                    <span className="text-xs font-medium text-foreground/70">
                        {health?.orchestrator ?? "—"}
                    </span>
                </div>

                {/* Activity icon */}
                <Activity className="ml-1 h-3.5 w-3.5 animate-pulse text-synapse-npu" />
            </div>
        </motion.header>
    );
}
