"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Bot, FileText } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export interface Message {
    id: string;
    role: "user" | "ai";
    content: string;
    sources?: string[];
    hardwareFlow?: string;
    timestamp: Date;
}

interface MessageBubbleProps {
    msg: Message;
}

function MessageBubble({ msg }: MessageBubbleProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
            <div
                className={`flex max-w-[80%] gap-2.5 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
            >
                {/* Avatar */}
                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        msg.role === "user"
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
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            msg.role === "user"
                                ? "bg-foreground text-white"
                                : "border border-zinc-200 bg-white text-zinc-800 shadow-sm"
                        }`}
                    >
                        {msg.content}
                    </div>

                    {/* Sources accordion */}
                    {msg.sources && msg.sources.length > 0 && (
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="sources" className="border-0">
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
    );
}

export default React.memo(MessageBubble);
