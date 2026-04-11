"use client";

import { Search, Globe, FileText, ArrowRight, Database, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { getKnowledgeSources, askSynapse, type AskResponse } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function ResearchPage() {
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [availableSources, setAvailableSources] = useState<string[]>([]);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [result, setResult] = useState<AskResponse | null>(null);

    // Fetch sources on mount
    useEffect(() => {
        const fetchSources = async () => {
            try {
                const res = await getKnowledgeSources();
                setAvailableSources(res.sources);
            } catch (err) {
                console.error("Failed to fetch sources:", err);
            }
        };
        fetchSources();
    }, []);

    const toggleSource = (source: string) => {
        setSelectedSources(prev =>
            prev.includes(source)
                ? prev.filter(s => s !== source)
                : [...prev, source]
        );
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isSearching) return;

        setIsSearching(true);
        setResult(null);
        try {
            const res = await askSynapse(query, selectedSources.length > 0 ? selectedSources : undefined);
            setResult(res);
        } catch (err) {
            console.error("Research failed:", err);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="flex h-full flex-col max-w-5xl mx-auto px-4 pb-12">
            {/* Header */}
            <header className="mb-6 flex items-center justify-between border-b border-neutral-200 py-4 dark:border-neutral-800">
                <div>
                    <nav className="text-sm text-neutral-500 font-medium mb-1">
                        <span className="hover:text-neutral-800 cursor-pointer dark:text-neutral-400 dark:hover:text-neutral-200">
                            Synapse
                        </span>
                        <span className="mx-2">/</span>
                        <span className="text-neutral-900 dark:text-neutral-100">
                            Deep Research
                        </span>
                    </nav>
                </div>
            </header>

            <div className="flex flex-col items-center flex-1">
                <div className="w-full max-w-3xl text-center mt-12 mb-8">
                    <h2 className="text-4xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4 tracking-tight">
                        What are we researching today?
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400 text-lg mb-8">
                        Query your documents or let the agent synthesize information across your memory.
                    </p>

                    <form onSubmit={handleSearch} className="relative group mb-6">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="h-6 w-6 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-14 pr-36 py-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl shadow-zinc-200/20 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-xl"
                            placeholder="Ask a question or enter a topic..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            disabled={isSearching}
                        />
                        <button
                            type="submit"
                            disabled={isSearching || !query.trim()}
                            className="absolute inset-y-3 right-3 px-6 bg-foreground text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSearching ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Synthesizing...
                                </>
                            ) : (
                                <>
                                    Analyze
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Source Selection Area */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">
                            <Database className="h-3 w-3" />
                            Target Context
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {availableSources.length > 0 ? (
                                availableSources.map((source) => (
                                    <button
                                        key={source}
                                        onClick={() => toggleSource(source)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                                            selectedSources.includes(source)
                                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 scale-105"
                                                : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400"
                                        )}
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                        {source}
                                        {selectedSources.includes(source) && <CheckCircle2 className="h-3 w-3 ml-0.5" />}
                                    </button>
                                ))
                            ) : (
                                <p className="text-xs text-neutral-400 italic">No knowledge sources found. Click Knowledge to add files.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Research Output Area */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-2xl shadow-zinc-200/50 mb-12"
                        >
                            <div className="flex items-center gap-2 mb-6 text-blue-600">
                                <Sparkles className="h-5 w-5" />
                                <span className="text-sm font-bold uppercase tracking-wider">Research Synthesis</span>
                            </div>

                            <div className="prose prose-neutral dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200 leading-relaxed text-lg">
                                {result.answer}
                            </div>

                            <div className="mt-8 pt-8 border-t border-neutral-100 dark:border-neutral-800">
                                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Supporting Documents</h4>
                                <div className="flex flex-wrap gap-2">
                                    {result.sources.map((source, i) => (
                                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300">
                                            <FileText className="h-4 w-4 text-emerald-500" />
                                            {source}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Minimal cn implementation for simplicity
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
