"use client";

import { Search, Globe, FileText, ArrowRight, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchSources, askSynapse, type Source } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ResearchPage() {
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [availableSources, setAvailableSources] = useState<Source[]>([]);

    // Suggestion popup state
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const recentTopics = [
        { title: "React Server Components architecture", type: "Web", date: "2 hours ago" },
        { title: "Local LLM Fine-tuning guide", type: "Doc", date: "Yesterday" },
        { title: "Notion UI Design System", type: "Web", date: "Yesterday" },
    ];

    // Fetch sources on mount
    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchSources();
                const filtered = data.filter(s => s.name !== 'user_input' && s.name !== 'web_ui');
                setAvailableSources(filtered);
            } catch (err) {
                console.error("Failed to load sources", err);
            }
        };
        load();
    }, []);

    // Detect @ mentions
    useEffect(() => {
        const lastAt = query.lastIndexOf("@");
        if (lastAt !== -1 && (lastAt === 0 || query[lastAt - 1] === " ")) {
            const filterText = query.slice(lastAt + 1);
            if (!filterText.includes(" ")) {
                setShowMentions(true);
                setMentionFilter(filterText);
                setSelectedIndex(0);
                return;
            }
        }
        setShowMentions(false);
    }, [query]);

    const filteredSources = availableSources.filter(s =>
        s.name.toLowerCase().includes(mentionFilter.toLowerCase()) &&
        !selectedSources.includes(s.name)
    );

    const handleSelectSource = useCallback((sourceName: string) => {
        if (!selectedSources.includes(sourceName)) {
            setSelectedSources(prev => [...prev, sourceName]);
        }
        const lastAt = query.lastIndexOf("@");
        const newValue = query.slice(0, lastAt).trim() + " ";
        setQuery(newValue);
        setShowMentions(false);
        inputRef.current?.focus();
    }, [query, selectedSources]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentions && filteredSources.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredSources.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredSources.length) % filteredSources.length);
            } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                handleSelectSource(filteredSources[selectedIndex].name);
            } else if (e.key === "Escape") {
                setShowMentions(false);
            }
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = query.trim();
        if (text) {
            setIsSearching(true);
            try {
                // We use askSynapse but perhaps Research Page has a different backend?
                // For now, based on user's request "fetch sources from knowledge as well", 
                // we'll assume it uses the same RAG pipeline.
                const response = await askSynapse(text, selectedSources);
                console.log("Research Result:", response);
                toast.success("Research completed");
                // In a real app, we'd navigate to results or show them below
            } catch (err) {
                toast.error("Research failed to connect to backend");
            } finally {
                setIsSearching(false);
            }
        }
    };

    return (
        <div className="flex h-full flex-col max-w-5xl mx-auto px-4">
            {/* Header */}
            <header className="mb-6 flex items-center justify-between border-b border-neutral-200 py-4 dark:border-neutral-800">
                <div>
                    <nav className="text-sm text-neutral-500 font-medium mb-1">
                        <span className="hover:text-neutral-800 cursor-pointer dark:text-neutral-400 dark:hover:text-neutral-200">
                            Synapse
                        </span>
                        <span className="mx-2">/</span>
                        <span className="text-neutral-900 dark:text-neutral-100">
                            Research
                        </span>
                    </nav>
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Search className="h-6 w-6" />
                        Deep Research
                    </h1>
                </div>
            </header>

            <div className="flex flex-col items-center justify-center py-12 flex-1 relative">
                <div className="w-full max-w-2xl text-center mb-12">
                    <h2 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                        What are we researching today?
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-8">
                        Search the web or query your documents for deep insights.
                    </p>

                    {/* Chips UI */}
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                        <AnimatePresence>
                            {selectedSources.map((source) => (
                                <motion.div
                                    key={source}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                >
                                    <Badge
                                        variant="secondary"
                                        className="bg-purple-50 text-purple-700 border-purple-200 pl-3 pr-1 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm"
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                        <span className="font-medium">{source}</span>
                                        <button
                                            onClick={() => setSelectedSources(prev => prev.filter(s => s !== source))}
                                            className="p-1 hover:bg-purple-200 rounded-lg transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <form onSubmit={handleSearch} className="relative group">
                        <AnimatePresence>
                            {showMentions && filteredSources.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full left-0 mb-4 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:bg-neutral-900 shadow-2xl z-50 p-1 text-left"
                                >
                                    <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                                        <Search className="h-4 w-4 text-neutral-400" />
                                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Knowledge Sources</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {filteredSources.map((source, i) => (
                                            <button
                                                key={source.name}
                                                type="button"
                                                onClick={() => handleSelectSource(source.name)}
                                                onMouseEnter={() => setSelectedIndex(i)}
                                                className={`flex w-full items-center gap-4 px-4 py-3.5 text-left text-sm transition-all rounded-xl ${i === selectedIndex ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20" : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                                    }`}
                                            >
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${i === selectedIndex ? "bg-purple-100 dark:bg-purple-900/40" : "bg-neutral-100 dark:bg-neutral-800"}`}>
                                                    <FileText className={`h-5 w-5 ${i === selectedIndex ? "text-purple-600" : "text-neutral-500"}`} />
                                                </div>
                                                <div className="flex-1 truncate">
                                                    <div className="font-semibold">{source.name}</div>
                                                    <div className="text-[10px] opacity-60 uppercase">{source.chunks} chunks stored</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="h-6 w-6 text-neutral-400 group-focus-within:text-purple-500 transition-colors" />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            className="block w-full pl-14 pr-32 py-5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] shadow-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-xl transition-all outline-none"
                            placeholder="Type @ to research specific documents..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isSearching}
                        />
                        <button
                            type="submit"
                            disabled={isSearching || !query.trim()}
                            className="absolute inset-y-2 right-2 px-6 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-[1.5rem] font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSearching ? "Thinking..." : "Research"}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </form>
                </div>

                <div className="w-full max-w-4xl mt-auto">
                    <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wider">
                        Recent Research Sessions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recentTopics.map((topic, i) => (
                            <div key={i} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer group shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    {topic.type === "Web" ? <Globe className="h-4 w-4 text-blue-500" /> : <FileText className="h-4 w-4 text-purple-500" />}
                                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{topic.type} Search</span>
                                </div>
                                <h4 className="text-neutral-900 dark:text-neutral-100 font-medium group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {topic.title}
                                </h4>
                                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                                    {topic.date}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
