"use client";

import MemoryDropzone from "@/components/MemoryDropzone";
import { Database } from "lucide-react";

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
                    <button className="bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
                        Add Source
                    </button>
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
