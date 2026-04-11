"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, FileText, Clock, X, Loader2, Globe } from "lucide-react";
import { askSynapse, fetchSources, type Source } from "@/lib/api";
import { toast } from "sonner";

interface SearchHistoryEntry {
    query: string;
    type: string;
    date: string;
}

export default function ResearchPage() {
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<{ answer: string; sources: string[] } | null>(null);

    // Real search history from localStorage
    const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
    const [availableSources, setAvailableSources] = useState<Source[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("synapse_research_history");
            if (stored) setSearchHistory(JSON.parse(stored));
        } catch {}

        fetchSources().then(data => {
            setAvailableSources(data.filter(s => s.name !== 'user_input' && s.name !== 'web_ui'));
        }).catch(() => {});
    }, []);

    const handleSearch = async () => {
        if (!query.trim() || isSearching) return;

        setIsSearching(true);
        setResults(null);

        try {
            const response = await askSynapse(query);
            setResults({
                answer: response.answer,
                sources: response.sources || [],
            });

            // Save to history
            const newEntry: SearchHistoryEntry = {
                query: query.trim(),
                type: "Research",
                date: new Date().toISOString(),
            };
            const updated = [newEntry, ...searchHistory].slice(0, 20); // Keep last 20
            setSearchHistory(updated);
            localStorage.setItem("synapse_research_history", JSON.stringify(updated));
        } catch {
            toast.error("Research query failed. Is the backend running?");
        } finally {
            setIsSearching(false);
        }
    };

    const clearResults = () => {
        setResults(null);
        setQuery("");
    };

    return (
        <div className="flex h-full flex-col max-w-5xl mx-auto w-full">
            {/* Header */}
            <header className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
                <div>
                    <nav className="text-sm text-neutral-500 font-medium mb-1 dark:text-neutral-400">
                        <span>Synapse</span>
                        <span className="mx-2">/</span>
                        <span className="text-neutral-900 dark:text-neutral-100">Research</span>
                    </nav>
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-indigo-500" />
                        Research Lab
                    </h1>
                </div>
            </header>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            placeholder="Ask a research question..."
                            className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 dark:text-neutral-200 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={isSearching || !query.trim()}
                        className="px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl text-sm font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        {isSearching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                        {isSearching ? "Searching..." : "Search"}
                    </button>
                </div>
            </div>

            {/* Results Section */}
            {isSearching && (
                <div className="mb-6 flex items-center gap-3 p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 rounded-xl">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" />
                    <div>
                        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">Researching...</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400">Searching memory bank + generating answer via local LLM</p>
                    </div>
                </div>
            )}

            {results && (
                <div className="mb-8 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    {/* Answer Card */}
                    <div className="bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-indigo-500" />
                                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Research Result</span>
                            </div>
                            <button 
                                onClick={clearResults} 
                                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                                {results.answer}
                            </p>
                        </div>
                    </div>

                    {/* Sources */}
                    {results.sources && results.sources.length > 0 && results.sources[0] !== "" && (
                        <div className="bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-4">
                            <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Retrieved Sources</h4>
                            <div className="flex flex-wrap gap-2">
                                {results.sources.map((src, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs rounded-lg"
                                    >
                                        <FileText className="h-3 w-3" />
                                        <span className="max-w-[200px] truncate">{src}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Content - Split Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Recent Research Sessions */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm overflow-hidden h-full">
                        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-neutral-500" />
                                Recent Research Sessions
                            </h3>
                            {searchHistory.length > 0 && (
                                <button 
                                    onClick={() => { setSearchHistory([]); localStorage.removeItem("synapse_research_history"); }}
                                    className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                                >
                                    Clear History
                                </button>
                            )}
                        </div>
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-700/50 max-h-[400px] overflow-y-auto">
                            {searchHistory.length === 0 ? (
                                <div className="p-8 text-center text-sm text-neutral-400">
                                    No research sessions yet. Try a search above.
                                </div>
                            ) : (
                                searchHistory.map((entry, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setQuery(entry.query); }}
                                        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                                                <Globe className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[350px]">
                                                    {entry.query}
                                                </div>
                                                <div className="text-xs text-neutral-400">
                                                    {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 rounded-full">
                                            {entry.type}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Knowledge Sources */}
                <div>
                    <div className="bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm overflow-hidden h-full">
                        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-700">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-neutral-500" />
                                Knowledge Sources
                            </h3>
                        </div>
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-700/50 max-h-[400px] overflow-y-auto">
                            {availableSources.length === 0 ? (
                                <div className="p-6 text-center text-sm text-neutral-400">
                                    No sources ingested yet.
                                </div>
                            ) : (
                                availableSources.map((source, i) => (
                                    <div key={i} className="px-5 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5 text-neutral-400" />
                                            <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate max-w-[130px]">{source.name}</span>
                                        </div>
                                        <span className="text-xs text-neutral-400">{source.chunks} chunks</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
