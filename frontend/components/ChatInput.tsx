"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, FileText, Database, Cpu, Bot, CheckCircle2, XCircle, Globe, Code } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getKnowledgeSources, getAgents, type Agent } from "@/lib/api";

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
}

type TriggerType = "@" | "/" | null;

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
    const [input, setInput] = useState("");
    const [activeTrigger, setActiveTrigger] = useState<TriggerType>(null);
    const [sources, setSources] = useState<string[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [filteredItems, setFilteredItems] = useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch sources and agents for mentions
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sourceRes, agentRes] = await Promise.all([
                    getKnowledgeSources(),
                    getAgents()
                ]);
                setSources(sourceRes.sources);
                setAgents(agentRes.agents);
            } catch (err) {
                console.error("Failed to fetch mention data:", err);
            }
        };
        fetchData();
    }, []);

    // Focus input when loading finishes
    useEffect(() => {
        if (!isLoading) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        }
    }, [isLoading]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart || 0;
        setInput(value);

        // Multi-trigger detection logic
        const lastAtPos = value.lastIndexOf("@", cursorPosition - 1);
        const lastSlashPos = value.lastIndexOf("/", cursorPosition - 1);

        // Find whichever trigger is closer to cursor and preceded by space/start
        let trigger: TriggerType = null;
        let triggerPos = -1;

        if (lastAtPos > lastSlashPos) {
            trigger = "@";
            triggerPos = lastAtPos;
        } else if (lastSlashPos > lastAtPos) {
            trigger = "/";
            triggerPos = lastSlashPos;
        } else if (lastAtPos === lastSlashPos && lastAtPos !== -1) {
            trigger = "@";
            triggerPos = lastAtPos;
        }

        if (trigger) {
            const charBeforeTrigger = triggerPos === 0 ? " " : value[triggerPos - 1];
            if (charBeforeTrigger === " " || charBeforeTrigger === "\n") {
                const query = value.slice(triggerPos + 1, cursorPosition).toLowerCase();

                if (trigger === "@") {
                    const filtered = sources.filter(s => s.toLowerCase().includes(query));
                    setFilteredItems(filtered);
                    setActiveTrigger(filtered.length > 0 ? "@" : null);
                } else {
                    const filtered = agents.filter(a => a.name.toLowerCase().includes(query));
                    setFilteredItems(filtered);
                    setActiveTrigger(filtered.length > 0 ? "/" : null);
                }
                setSelectedIndex(0);
            } else {
                setActiveTrigger(null);
            }
        } else {
            setActiveTrigger(null);
        }
    };

    const insertMention = useCallback((item: any) => {
        const cursorPosition = inputRef.current?.selectionStart || 0;
        const triggerChar = activeTrigger;
        if (!triggerChar) return;

        const lastTriggerPos = input.lastIndexOf(triggerChar, cursorPosition - 1);

        if (lastTriggerPos !== -1) {
            const name = activeTrigger === "@" ? item : item.name;
            const newValue =
                input.slice(0, lastTriggerPos) +
                `[${name}] ` +
                input.slice(cursorPosition);

            setInput(newValue);
            setActiveTrigger(null);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [input, activeTrigger]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (activeTrigger) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
            } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                insertMention(filteredItems[selectedIndex]);
            } else if (e.key === "Escape") {
                setActiveTrigger(null);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const query = input.trim();
        if (!query || isLoading || !!activeTrigger) return;

        onSend(query);
        setInput("");
    };

    // Helper to render correct icon for agents
    const AgentIcon = ({ icon, className }: { icon: string, className?: string }) => {
        switch (icon) {
            case "Globe": return <Globe className={className} />;
            case "Code": return <Code className={className} />;
            case "FileText": return <FileText className={className} />;
            default: return <Bot className={className} />;
        }
    };

    return (
        <div className="relative mt-3">
            {/* Mention Menu */}
            <AnimatePresence>
                {activeTrigger && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-2 w-72 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-zinc-200/50"
                    >
                        <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            {activeTrigger === "@" ? (
                                <>
                                    <Database className="h-3 w-3" />
                                    Knowledge Sources
                                </>
                            ) : (
                                <>
                                    <Cpu className="h-3 w-3" />
                                    Available Agents
                                </>
                            )}
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {filteredItems.map((item, index) => {
                                const isAgent = activeTrigger === "/";
                                const name = isAgent ? item.name : item;

                                return (
                                    <button
                                        key={name}
                                        onClick={() => insertMention(item)}
                                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${index === selectedIndex
                                            ? "bg-zinc-100 ring-1 ring-inset ring-zinc-200"
                                            : "hover:bg-zinc-50"
                                            }`}
                                    >
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${index === selectedIndex ? "bg-white shadow-sm" : "bg-zinc-100"
                                            }`}>
                                            {isAgent ? (
                                                <AgentIcon icon={item.icon} className={`h-4 w-4 ${index === selectedIndex ? "text-blue-600" : "text-zinc-500"
                                                    }`} />
                                            ) : (
                                                <FileText className={`h-4 w-4 ${index === selectedIndex ? "text-purple-600" : "text-zinc-500"
                                                    }`} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-zinc-800">
                                                {name}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                                                {isAgent ? (
                                                    item.connected ? (
                                                        <>
                                                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                                                            Ready to assist
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-2.5 w-2.5 text-rose-500" />
                                                            Disconnected
                                                        </>
                                                    )
                                                ) : "Reference Document"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask Synapse... (Type @ for files, / for agents)`}
                    className="h-11 flex-1 rounded-xl border-zinc-200 bg-white text-sm shadow-sm placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-400"
                    disabled={isLoading}
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim() || !!activeTrigger}
                    className="h-11 w-11 shrink-0 rounded-xl bg-foreground text-white shadow-sm transition-transform hover:bg-foreground/90 hover:scale-105 active:scale-95"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
