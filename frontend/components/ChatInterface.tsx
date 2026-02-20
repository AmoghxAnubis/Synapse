"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bot, User, ChevronDown, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { askSynapse } from "@/lib/api";

interface Message {
    id: string;
    role: "user" | "ai";
    content: string;
    sources?: string[];
    hardwareFlow?: string;
    timestamp: Date;
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        const query = input.trim();
        if (!query || isLoading) return;

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: query,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await askSynapse(query);
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
            inputRef.current?.focus();
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
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                                        }`}
                                >
                                    <div
                                        className={`flex max-w-[80%] gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === "user"
                                                    ? "bg-foreground"
                                                    : "border border-zinc-200 bg-white"
                                                }`}
                                        >
                                            {msg.role === "user" ? (
                                                <User className="h-3.5 w-3.5 text-white" />
                                            ) : (
                                                <Bot className="h-3.5 w-3.5 text-purple-600" />
                                            )}
                                        </div>

                                        {/* Bubble */}
                                        <div className="flex flex-col gap-1.5">
                                            <div
                                                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                                                        ? "bg-foreground text-white"
                                                        : "border border-zinc-200 bg-white text-zinc-800 shadow-sm"
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>

                                            {/* Sources accordion */}
                                            {msg.sources && msg.sources.length > 0 && (
                                                <Accordion
                                                    type="single"
                                                    collapsible
                                                    className="w-full"
                                                >
                                                    <AccordionItem
                                                        value="sources"
                                                        className="border-0"
                                                    >
                                                        <AccordionTrigger className="py-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 hover:no-underline">
                                                            <span className="flex items-center gap-1.5">
                                                                <FileText className="h-3 w-3" />
                                                                {msg.sources.length} source
                                                                {msg.sources.length > 1 ? "s" : ""}
                                                            </span>
                                                        </AccordionTrigger>
                                                        <AccordionContent className="pb-1">
                                                            <div className="flex flex-wrap gap-1 px-2">
                                                                {msg.sources.map((src, i) => (
                                                                    <Badge
                                                                        key={i}
                                                                        variant="secondary"
                                                                        className="border border-zinc-200 bg-white text-[10px] font-normal text-zinc-600"
                                                                    >
                                                                        {src.length > 80
                                                                            ? src.slice(0, 80) + "…"
                                                                            : src}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            )}

                                            {/* Hardware flow */}
                                            {msg.hardwareFlow && (
                                                <span className="px-2 text-[10px] text-zinc-400">
                                                    ⚡ {msg.hardwareFlow}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
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

            {/* Input bar */}
            <div className="mt-3">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex gap-2"
                >
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask Synapse..."
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
        </div>
    );
}
