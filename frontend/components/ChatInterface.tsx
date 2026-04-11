"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { askSynapse, fetchSources, fetchAgents, type Source, type Agent } from "@/lib/api";
import MessageBubble, { type Message } from "@/components/MessageBubble";
import ChatInput from "./ChatInput";
import { X, Globe, Code, FileText, Bot } from "lucide-react";

// Mapping string icon names to Lucide components
const agentIcons: Record<string, any> = {
    Globe: Globe,
    Code: Code,
    FileText: FileText,
    Bot: Bot,
};

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [availableSources, setAvailableSources] = useState<Source[]>([]);
    const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
    const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch sources and agents for @ and / commands
    useEffect(() => {
        const load = async () => {
            try {
                const [sourcesData, agentsData] = await Promise.all([
                    fetchSources(),
                    fetchAgents()
                ]);

                const filteredSources = sourcesData.filter(s => s.name !== 'user_input' && s.name !== 'web_ui');
                setAvailableSources(filteredSources);
                setAvailableAgents(agentsData);
            } catch (err) {
                console.error("Failed to load context for chat", err);
            }
        };
        load();
    }, []);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (query: string) => {
        if (!query || isLoading) return;

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: query,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const response = await askSynapse(query, selectedSources, activeAgent?.id);
            const aiMsg: Message = {
                id: crypto.randomUUID(),
                role: "ai",
                content: response.answer,
                sources: response.sources,
                hardwareFlow: response.hardware_flow,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch {
            const errMsg: Message = {
                id: crypto.randomUUID(),
                role: "ai",
                content: "⚠️ Connection failed. Is the Synapse backend running?",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 px-1 pb-3">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <h2 className="text-sm font-semibold tracking-wide text-zinc-800 uppercase">
                    Synapse Chat
                </h2>
                {messages.length > 0 && (
                    <Badge
                        variant="secondary"
                        className="ml-auto border border-zinc-200 bg-zinc-50 text-[10px] text-zinc-600"
                    >
                        {messages.length} messages
                    </Badge>
                )}
            </div>

            {/* Messages */}
            <div className="relative flex-1 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/50">
                <ScrollArea className="h-full">
                    <div ref={scrollRef} className="flex flex-col gap-3 p-5">
                        {messages.length === 0 && (
                            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                                    <Bot className="h-7 w-7 text-zinc-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-zinc-600">
                                        Ask Synapse anything
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-500">
                                        Queries are answered using your ingested memory + local LLM
                                    </p>
                                </div>
                            </div>
                        )}

                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <MessageBubble key={msg.id} msg={msg} />
                            ))}
                        </AnimatePresence>

                        {/* Typing indicator */}
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white">
                                    <Bot className="h-3.5 w-3.5 text-purple-600" />
                                </div>
                                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 shadow-sm">
                                    <div className="flex items-center gap-1.5">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
                                        <span className="text-xs text-zinc-500">Thinking...</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Context chips (Agents and Sources) */}
            <div className="flex flex-wrap gap-2 px-1 mb-2">
                {/* Active Agent Chip */}
                {activeAgent && (
                    <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 pl-2 pr-1 py-1 rounded-lg flex items-center gap-1 animate-in fade-in slide-in-from-bottom-1"
                    >
                        {(() => {
                            const Icon = agentIcons[activeAgent.icon] || Bot;
                            return <Icon className="h-3 w-3" />;
                        })()}
                        <span className="font-semibold">{activeAgent.name}</span>
                        <button
                            onClick={() => setActiveAgent(null)}
                            className="p-0.5 hover:bg-emerald-200 rounded-md transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                )}

                {/* Source selection chips */}
                {selectedSources.map((source) => (
                    <Badge
                        key={source}
                        variant="secondary"
                        className="bg-purple-50 text-purple-700 border-purple-200 pl-2 pr-1 py-1 rounded-lg flex items-center gap-1 animate-in fade-in slide-in-from-bottom-1"
                    >
                        <span className="truncate max-w-[150px]">{source}</span>
                        <button
                            onClick={() => setSelectedSources(prev => prev.filter(s => s !== source))}
                            className="p-0.5 hover:bg-purple-200 rounded-md transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>

            {/* Input bar */}
            <ChatInput
                onSend={handleSend}
                isLoading={isLoading}
                availableSources={availableSources.map(s => s.name)}
                selectedSources={selectedSources}
                onAddSource={(name) => {
                    if (!selectedSources.includes(name)) {
                        setSelectedSources(prev => [...prev, name]);
                    }
                }}
                availableAgents={availableAgents}
                activeAgentId={activeAgent?.id || null}
                onSelectAgent={(agentId) => {
                    const agent = availableAgents.find(a => a.id === agentId);
                    if (agent) setActiveAgent(agent);
                }}
            />
        </div>
    );
}
