"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when loading finishes
    useEffect(() => {
        if (!isLoading) {
            // slightly delayed to ensure UI is ready/enabled
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
        <div className="mt-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
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
    );
}
