"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface SyncLogEntry {
    id: string;
    timestamp: string;
    platform: string;
    message: string;
    type: "info" | "success" | "error";
}

interface SyncLogProps {
    entries: SyncLogEntry[];
}

const typeColors: Record<string, string> = {
    info: "text-blue-600",
    success: "text-emerald-600",
    error: "text-red-500",
};

const platformColors: Record<string, string> = {
    GitHub: "text-purple-600",
    Slack: "text-pink-600",
    Notion: "text-zinc-800",
    Jira: "text-blue-600",
    System: "text-zinc-500",
};

export default function SyncLog({ entries }: SyncLogProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [entries]);

    return (
        <div className="flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center gap-2 px-1">
                <Terminal className="h-4 w-4 text-zinc-500" />
                <h3 className="text-sm font-semibold text-zinc-800">Sync Activity</h3>
                {entries.length > 0 && (
                    <span className="ml-auto text-[10px] text-zinc-400">
                        {entries.length} events
                    </span>
                )}
            </div>

            {/* Log terminal */}
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                <ScrollArea className="h-48">
                    <div className="p-4 font-mono text-xs leading-relaxed">
                        {entries.length === 0 ? (
                            <p className="text-zinc-400">
                                No sync activity yet. Connect an integration and hit &quot;Sync Now&quot;
                                to see logs here.
                            </p>
                        ) : (
                            <AnimatePresence initial={false}>
                                {entries.map((entry) => (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex gap-2 py-0.5"
                                    >
                                        <span className="shrink-0 text-zinc-400">
                                            [{entry.timestamp}]
                                        </span>
                                        <span
                                            className={`shrink-0 font-semibold ${platformColors[entry.platform] ?? "text-zinc-600"
                                                }`}
                                        >
                                            {entry.platform}:
                                        </span>
                                        <span className={typeColors[entry.type] ?? "text-zinc-600"}>
                                            {entry.message}
                                        </span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                        <div ref={bottomRef} />
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
