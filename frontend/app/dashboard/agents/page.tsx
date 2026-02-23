"use client";

import { Bot } from "lucide-react";

export default function AgentsPage() {
    return (
        <div className="flex h-full flex-col max-w-4xl mx-auto">
            {/* Page Header */}
            <header className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
                <div>
                    <nav className="text-sm text-neutral-500 font-medium mb-1">
                        <span className="hover:text-neutral-800 cursor-pointer dark:text-neutral-400 dark:hover:text-neutral-200">
                            Synapse
                        </span>
                        <span className="mx-2">/</span>
                        <span className="text-neutral-900 dark:text-neutral-100">
                            Agents
                        </span>
                    </nav>
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Bot className="h-6 w-6" />
                        Manage Agents
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button className="bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
                        Create Agent
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center text-center mt-20">
                <div className="rounded-full bg-neutral-100 p-4 mb-4 dark:bg-neutral-800">
                    <Bot className="h-10 w-10 text-neutral-500 dark:text-neutral-400" />
                </div>
                <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    Agent Orchestration Coming Soon
                </h2>
                <p className="max-w-md text-sm text-neutral-500 dark:text-neutral-400">
                    Soon you will be able to create, configure, and orchestrate specialized lightweight AI agents locally to manage different domains of knowledge and tasks.
                </p>
            </div>
        </div>
    );
}
