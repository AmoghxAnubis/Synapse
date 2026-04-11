"use client";

import { useState, useEffect } from "react";
import MemoryDropzone from "@/components/MemoryDropzone";
import { Database, FileText, RefreshCw } from "lucide-react";
import { getKnowledgeSources } from "@/lib/api";
import { Card } from "@/components/ui/card";

export default function KnowledgeBase() {
    const [sources, setSources] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSources = async () => {
        setIsLoading(true);
        try {
            const data = await getKnowledgeSources();
            setSources(data.sources);
        } catch (error) {
            console.error("Failed to fetch sources:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSources();
    }, []);

    return (
        <div className="flex h-full flex-col">
            {/* Page Header */}
            <header className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
                <div>
                    <nav className="text-sm text-neutral-500 font-medium mb-1">
                        <span className="hover:text-neutral-800 cursor-pointer dark:text-neutral-400 dark:hover:text-neutral-200">
                            Synapse
                        </span>
                        <span className="mx-2">/</span>
                        <span className="text-neutral-900 dark:text-neutral-100">
                            Knowledge Base
                        </span>
                    </nav>
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Database className="h-6 w-6" />
                        Memory & Knowledge
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchSources}
                        className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Refresh list"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                    <button className="bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
                        Add Source
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* Left col - Dropzone (taking up 1 col) */}
                <div className="lg:col-span-1">
                    <MemoryDropzone onUploadSuccess={fetchSources} />
                    <p className="text-sm text-neutral-500 mt-4 dark:text-neutral-400">
                        Upload documents (PDF, TXT, MD, DOCX) to expand Synapse's knowledge base.
                        Files are processed locally and stored securely.
                    </p>
                </div>

                {/* Right col - List of uploaded sources (taking up 2 cols) */}
                <div className="lg:col-span-2 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 p-6 flex flex-col overflow-hidden">
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Stored Knowledge
                    </h3>

                    {isLoading && sources.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <RefreshCw className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mb-4 animate-spin" />
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading your knowledge base...</p>
                        </div>
                    ) : sources.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <Database className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mb-4" />
                            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                                No Knowledge Sources Yet
                            </h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
                                Upload your first document using the dropzone on the left. Synapse will process it and index it for future conversations.
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {sources.map((source, index) => (
                                    <Card key={index} className="p-4 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50 transition-all cursor-default flex items-start gap-3 bg-neutral-50/50 dark:bg-neutral-900/50">
                                        <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate" title={source}>
                                                {source}
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                Vector Segment • Persistent
                                            </p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

