"use client";

import MemoryDropzone from "@/components/MemoryDropzone";
import { Database, Link as LinkIcon, BookOpen, GraduationCap, UploadCloud, ChevronDown, Loader2, FileText, Globe, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback } from "react";
import { fetchSources, deleteSource, ingestURL, type Source } from "@/lib/api";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function KnowledgeBase() {
    const [sources, setSources] = useState<Source[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // URL ingestion modal
    const [showUrlModal, setShowUrlModal] = useState(false);
    const [urlInput, setUrlInput] = useState("");
    const [isIngesting, setIsIngesting] = useState(false);

    const loadSources = useCallback(async () => {
        try {
            const data = await fetchSources();
            // Filter out internal tags if any
            const filtered = data.filter(s => s.name !== 'user_input' && s.name !== 'web_ui');
            setSources(filtered);
        } catch {
            toast.error("Failed to load sources");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSources();
    }, [loadSources]);

    const handleDelete = async (name: string) => {
        try {
            await deleteSource(name);
            toast.success(`Deleted: ${name}`);
            loadSources();
        } catch {
            toast.error(`Failed to delete ${name}`);
        }
    };

    const handleUrlIngest = async () => {
        if (!urlInput.trim()) return;
        // Basic URL validation
        try {
            new URL(urlInput);
        } catch {
            toast.error("Please enter a valid URL");
            return;
        }
        setIsIngesting(true);
        try {
            const result = await ingestURL(urlInput.trim());
            toast.success(`Ingested ${result.chunks_processed} chunks from URL`);
            setUrlInput("");
            setShowUrlModal(false);
            loadSources();
        } catch {
            toast.error("Failed to ingest URL. Check if the URL is accessible.");
        } finally {
            setIsIngesting(false);
        }
    };

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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600">
                                <span>Add Source</span>
                                <ChevronDown className="h-4 w-4 opacity-70" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-1 rounded-xl shadow-lg border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 animate-in fade-in-80 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 p-1">
                            <DropdownMenuLabel className="text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-400 px-2 py-1.5 mt-1">
                                Data Sources
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800" />
                            <DropdownMenuGroup>
                                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-neutral-100 dark:focus:bg-neutral-800 py-2 px-2 rounded-md transition-colors">
                                    <UploadCloud className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                                    <span>Upload Files</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={() => setShowUrlModal(true)}
                                    className="flex items-center gap-2 cursor-pointer focus:bg-neutral-100 dark:focus:bg-neutral-800 py-2 px-2 rounded-md transition-colors"
                                >
                                    <LinkIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                                    <span>Add Web URL</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    disabled
                                    className="flex items-center gap-2 cursor-not-allowed opacity-50 py-2 px-2 rounded-md transition-colors"
                                >
                                    <Database className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                                    <span>Connect Database</span>
                                    <span className="ml-auto text-[10px] font-semibold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">Soon</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800" />
                            <DropdownMenuLabel className="text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-400 px-2 py-1.5 mt-1">
                                Integrations
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800" />
                            <DropdownMenuGroup>
                                <DropdownMenuItem 
                                    disabled
                                    className="flex items-center gap-2 cursor-not-allowed opacity-50 py-2 px-2 rounded-md transition-colors"
                                >
                                    <BookOpen className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                                    <span>Academic Learning Link</span>
                                    <span className="ml-auto text-[10px] font-semibold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">Soon</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    disabled
                                    className="flex items-center gap-2 cursor-not-allowed opacity-50 py-2 px-2 rounded-md transition-colors"
                                >
                                    <GraduationCap className="h-4 w-4" />
                                    <span>Login with IEEE</span>
                                    <span className="ml-auto text-[10px] font-semibold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">Soon</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <MemoryDropzone onUploadSuccess={loadSources} />
                    <p className="text-sm text-neutral-500 mt-4 dark:text-neutral-400">
                        Upload documents (PDF, TXT, MD, DOCX) to expand Synapse's knowledge base.
                        Files are processed locally and stored securely.
                    </p>
                </div>

                <div className="lg:col-span-2 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-neutral-400" />
                            Ingested Sources
                        </h3>
                        <span className="text-xs font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
                            {sources.length} Total
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-1 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
                        </div>
                    ) : sources.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center text-center">
                            <Database className="h-10 w-10 text-neutral-200 dark:text-neutral-800 mb-4" />
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                                No Knowledge Sources Yet
                            </h4>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
                                Upload your first document using the dropzone on the left, or add a web URL.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {sources.map((source) => (
                                <div 
                                    key={source.name} 
                                    className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                                            source.name.startsWith('http') 
                                                ? 'bg-blue-50 dark:bg-blue-900/20' 
                                                : source.name.includes('_sync')
                                                    ? 'bg-purple-50 dark:bg-purple-900/20'
                                                    : 'bg-emerald-50 dark:bg-emerald-900/20'
                                        }`}>
                                            {source.name.startsWith('http') ? (
                                                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            ) : source.name.includes('_sync') ? (
                                                <LinkIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                            ) : (
                                                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                                {source.name}
                                            </h4>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                {source.chunks} chunks processed
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(source.name)}
                                        className="h-8 w-8 rounded-md flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* URL Ingestion Modal */}
            {showUrlModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                <Globe className="h-5 w-5 text-blue-500" />
                                Ingest Web URL
                            </h3>
                            <button onClick={() => setShowUrlModal(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md">
                                <X className="h-4 w-4 text-neutral-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Enter a URL to scrape and add its content to your knowledge base.
                            </p>
                            <input
                                type="url"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleUrlIngest()}
                                placeholder="https://example.com/article"
                                className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:text-neutral-200"
                                disabled={isIngesting}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowUrlModal(false)}
                                    className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUrlIngest}
                                    disabled={isIngesting || !urlInput.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {isIngesting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    {isIngesting ? "Ingesting..." : "Ingest URL"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
