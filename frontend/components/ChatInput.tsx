import { useState, useRef, useEffect, useCallback } from "react";
import { Send, FileText, Search, Bot, Globe, Code } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { type Agent } from "@/lib/api";

const agentIcons: Record<string, any> = {
    Globe: Globe,
    Code: Code,
    FileText: FileText,
};

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    availableSources: string[];
    selectedSources: string[];
    onAddSource: (name: string) => void;
    availableAgents: Agent[];
    activeAgentId: number | null;
    onSelectAgent: (id: number) => void;
}

export default function ChatInput({
    onSend,
    isLoading,
    availableSources,
    selectedSources,
    onAddSource,
    availableAgents,
    activeAgentId,
    onSelectAgent
}: ChatInputProps) {
    const [input, setInput] = useState("");
    const [showMentions, setShowMentions] = useState(false);
    const [showAgents, setShowAgents] = useState(false);
    const [filter, setFilter] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredSources = availableSources.filter(s =>
        s.toLowerCase().includes(filter.toLowerCase()) &&
        !selectedSources.includes(s)
    );

    const filteredAgents = availableAgents.filter(a =>
        a.name.toLowerCase().includes(filter.toLowerCase()) &&
        a.id !== activeAgentId
    );

    // Detect @ mentions and / agents
    useEffect(() => {
        const lastAt = input.lastIndexOf("@");
        const lastSlash = input.lastIndexOf("/");

        // Check for @ mentions
        if (lastAt !== -1 && (lastAt === 0 || input[lastAt - 1] === " ") && lastAt >= lastSlash) {
            const filterText = input.slice(lastAt + 1);
            if (!filterText.includes(" ")) {
                setShowMentions(true);
                setShowAgents(false);
                setFilter(filterText);
                setSelectedIndex(0);
                return;
            }
        }

        // Check for / agents
        if (lastSlash !== -1 && (lastSlash === 0 || input[lastSlash - 1] === " ") && lastSlash >= lastAt) {
            const filterText = input.slice(lastSlash + 1);
            if (!filterText.includes(" ")) {
                setShowAgents(true);
                setShowMentions(false);
                setFilter(filterText);
                setSelectedIndex(0);
                return;
            }
        }

        setShowMentions(false);
        setShowAgents(false);
    }, [input]);

    const handleSelectSource = useCallback((source: string) => {
        onAddSource(source);
        const lastAt = input.lastIndexOf("@");
        const newValue = input.slice(0, lastAt).trim() + " ";
        setInput(newValue);
        setShowMentions(false);
        inputRef.current?.focus();
    }, [input, onAddSource]);

    const handleSelectAgent = useCallback((agentId: number) => {
        onSelectAgent(agentId);
        const lastSlash = input.lastIndexOf("/");
        const newValue = input.slice(0, lastSlash).trim() + " ";
        setInput(newValue);
        setShowAgents(false);
        inputRef.current?.focus();
    }, [input, onSelectAgent]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const activeList = showMentions ? filteredSources : showAgents ? filteredAgents : null;

        if (activeList && activeList.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % activeList.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + activeList.length) % activeList.length);
            } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                if (showMentions) handleSelectSource(filteredSources[selectedIndex]);
                else handleSelectAgent(filteredAgents[selectedIndex].id);
            } else if (e.key === "Escape") {
                setShowMentions(false);
                setShowAgents(false);
            }
        }
    };

    // Focus input when loading finishes
    useEffect(() => {
        if (!isLoading) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        }
    }, [isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const query = input.trim();
        if (!query || isLoading) return;

        onSend(query);
        setInput("");
    };

    return (
        <div className="mt-3 relative">
            <AnimatePresence>
                {(showMentions || showAgents) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-2 w-full max-w-sm overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl z-50 p-1"
                    >
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100 mb-1">
                            <Search className="h-3.5 w-3.5 text-zinc-400" />
                            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                                {showMentions ? "Mention Source" : "Select Agent"}
                            </span>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {showMentions ? filteredSources.map((source, i) => (
                                <button
                                    key={source}
                                    onClick={() => handleSelectSource(source)}
                                    onMouseEnter={() => setSelectedIndex(i)}
                                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors rounded-lg ${i === selectedIndex ? "bg-purple-50 text-purple-700" : "text-zinc-700 hover:bg-zinc-50"
                                        }`}
                                >
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${i === selectedIndex ? "bg-purple-100" : "bg-zinc-100"}`}>
                                        <FileText className={`h-4 w-4 ${i === selectedIndex ? "text-purple-600" : "text-zinc-500"}`} />
                                    </div>
                                    <span className="flex-1 truncate font-medium">{source}</span>
                                </button>
                            )) : filteredAgents.map((agent, i) => (
                                <button
                                    key={agent.id}
                                    onClick={() => handleSelectAgent(agent.id)}
                                    onMouseEnter={() => setSelectedIndex(i)}
                                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors rounded-lg ${i === selectedIndex ? "bg-emerald-50 text-emerald-700" : "text-zinc-700 hover:bg-zinc-50"
                                        }`}
                                >
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${i === selectedIndex ? "bg-emerald-100" : "bg-zinc-100"}`}>
                                        {(() => {
                                            const Icon = agentIcons[agent.icon] || Bot;
                                            return <Icon className={`h-4 w-4 ${i === selectedIndex ? "text-emerald-600" : "text-zinc-500"}`} />;
                                        })()}
                                    </div>
                                    <div className="flex-1 truncate">
                                        <div className="font-medium truncate">{agent.name}</div>
                                        <div className="text-[10px] text-zinc-400 truncate">{agent.description}</div>
                                    </div>
                                </button>
                            ))}

                            {((showMentions && filteredSources.length === 0) || (showAgents && filteredAgents.length === 0)) && (
                                <div className="px-3 py-6 text-center text-zinc-400 text-xs italic">
                                    No results found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Synapse... (Type / for Agents, @ for Sources)"
                    className="h-11 flex-1 rounded-xl border-zinc-200 bg-white text-sm shadow-sm placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-400"
                    disabled={isLoading}
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim()}
                    className="h-11 w-11 shrink-0 rounded-xl bg-foreground text-white shadow-sm transition-transform hover:bg-foreground/90 hover:scale-105 active:scale-95"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
