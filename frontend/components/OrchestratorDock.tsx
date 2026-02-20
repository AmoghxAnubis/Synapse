"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Focus, Calendar, Search } from "lucide-react";
import { setOrchestratorMode } from "@/lib/api";
import { toast } from "sonner";

const modes = [
    {
        id: "FOCUS",
        label: "Focus",
        emoji: "🎯",
        icon: Focus,
        description: "Silence notifications",
        gradient: "from-emerald-500 to-teal-600",
        activeColor: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        glowClass: "glow-npu",
    },
    {
        id: "MEETING",
        label: "Meeting",
        emoji: "📅",
        icon: Calendar,
        description: "Open notepad & tools",
        gradient: "from-purple-500 to-violet-600",
        activeColor: "bg-purple-500/10 border-purple-500/30 text-purple-400",
        glowClass: "glow-gpu",
    },
    {
        id: "RESEARCH",
        label: "Research",
        emoji: "🔍",
        icon: Search,
        description: "Open browser & calc",
        gradient: "from-blue-500 to-indigo-600",
        activeColor: "bg-blue-500/10 border-blue-500/30 text-blue-400",
        glowClass: "glow-cpu",
    },
] as const;

interface OrchestratorDockProps {
    activeMode?: string;
    onModeChange?: (mode: string) => void;
}

export default function OrchestratorDock({
    activeMode: externalMode,
    onModeChange,
}: OrchestratorDockProps) {
    const [internalMode, setInternalMode] = useState("FOCUS");
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const activeMode = externalMode ?? internalMode;

    const handleModeSwitch = async (modeId: string) => {
        if (modeId === activeMode || isLoading) return;

        setIsLoading(modeId);
        try {
            await setOrchestratorMode(modeId);
            setInternalMode(modeId);
            onModeChange?.(modeId);

            const mode = modes.find((m) => m.id === modeId);
            toast.success(`Switched to ${mode?.label}`, {
                description: mode?.description,
            });
        } catch {
            toast.error("Failed to switch mode", {
                description: "Could not reach Synapse backend.",
            });
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
            <div className="glass-strong flex items-center gap-1.5 rounded-2xl p-1.5 shadow-2xl">
                {modes.map((mode) => {
                    const isActive = activeMode === mode.id;
                    const Icon = mode.icon;

                    return (
                        <motion.button
                            key={mode.id}
                            onClick={() => handleModeSwitch(mode.id)}
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.94 }}
                            disabled={isLoading !== null}
                            className={`relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-300 ${isActive
                                    ? `${mode.activeColor} border ${mode.glowClass}`
                                    : "border border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground/80"
                                }`}
                        >
                            {/* Active indicator dot */}
                            {isActive && (
                                <motion.span
                                    layoutId="activeDot"
                                    className="absolute -top-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r"
                                    style={{
                                        backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                                    }}
                                />
                            )}

                            <span className="text-base">{mode.emoji}</span>
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{mode.label}</span>

                            {/* Loading spinner */}
                            {isLoading === mode.id && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm"
                                >
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                </motion.span>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Mode description */}
            <motion.p
                key={activeMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-center text-[10px] tracking-wider text-muted-foreground/50 uppercase"
            >
                {modes.find((m) => m.id === activeMode)?.description}
            </motion.p>
        </motion.div>
    );
}
