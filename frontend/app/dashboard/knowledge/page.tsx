"use client";

import MemoryDropzone from "@/components/MemoryDropzone";
import { Database, Link as LinkIcon, BookOpen, GraduationCap, UploadCloud, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function KnowledgeBase() {
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
                                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-neutral-100 dark:focus:bg-neutral-800 py-2 px-2 rounded-md transition-colors">
                                    <LinkIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                                    <span>Add Web URL</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-neutral-100 dark:focus:bg-neutral-800 py-2 px-2 rounded-md transition-colors">
                                    <Database className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                                    <span>Connect Database</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800" />
                            <DropdownMenuLabel className="text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-400 px-2 py-1.5 mt-1">
                                Integrations
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800" />
                            <DropdownMenuGroup>
                                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-neutral-100 dark:focus:bg-neutral-800 py-2 px-2 rounded-md transition-colors">
                                    <BookOpen className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                                    <span>Academic Learning Link</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-neutral-100 dark:focus:bg-neutral-800 py-2 px-2 rounded-md transition-colors text-blue-600 dark:text-blue-400 focus:text-blue-700 dark:focus:text-blue-300">
                                    <GraduationCap className="h-4 w-4" />
                                    <span>Login with IEEE</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left col - Dropzone (taking up 1 col) */}
                <div className="lg:col-span-1">
                    <MemoryDropzone />
                    <p className="text-sm text-neutral-500 mt-4 dark:text-neutral-400">
                        Upload documents (PDF, TXT, MD, DOCX) to expand Synapse's knowledge base.
                        Files are processed locally and stored securely.
                    </p>
                </div>

                {/* Right col - List of uploaded sources (taking up 2 cols) */}
                <div className="lg:col-span-2 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 p-6 flex flex-col items-center justify-center text-center">
                    <Database className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mb-4" />
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                        No Knowledge Sources Yet
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
                        Upload your first document using the dropzone on the left. Synapse will process it and index it for future conversations.
                    </p>
                </div>
            </div>
        </div>
    );
}
