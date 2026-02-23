"use client";

import { Search, Globe, FileText, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function ResearchPage() {
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const recentTopics = [
        { title: "React Server Components architecture", type: "Web", date: "2 hours ago" },
        { title: "Local LLM Fine-tuning guide", type: "Doc", date: "Yesterday" },
        { title: "Notion UI Design System", type: "Web", date: "Yesterday" },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setIsSearching(true);
            // Simulate search
            setTimeout(() => {
                setIsSearching(false);
                setQuery("");
            }, 1000);
        }
    };

    return (
        <div className="flex h-full flex-col max-w-5xl mx-auto">
            {/* Header */}
            <header className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
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
                        Search the web, query your documents, or let the agent synthesize information.
                    </p>
                    <form onSubmit={handleSearch} className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-32 py-4 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition-all outline-none"
                            placeholder="Ask a question or enter a topic..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            disabled={isSearching}
                        />
                        <button
                            type="submit"
                            disabled={isSearching || !query.trim()}
                            className="absolute inset-y-2 right-2 px-4 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSearching ? "Searching..." : "Search"}
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
                            <div key={i} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-2 mb-2">
                                    {topic.type === "Web" ? <Globe className="h-4 w-4 text-blue-500" /> : <FileText className="h-4 w-4 text-emerald-500" />}
                                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{topic.type} Search</span>
                                </div>
                                <h4 className="text-neutral-900 dark:text-neutral-100 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
