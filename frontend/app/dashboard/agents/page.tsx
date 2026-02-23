"use client";

import { useState } from "react";
import { Bot, Plus, Settings2, FileText, Globe, Code, BrainCircuit, Trash2, Search, TerminalSquare, Database } from "lucide-react";
import { cn } from "@/lib/utils";

const mockAgents = [
    { id: 1, name: "Research Assistant", description: "Deep dives into topics", icon: Globe, active: true },
    { id: 2, name: "Code Wizard", description: "Helps with debugging", icon: Code, active: false },
    { id: 3, name: "Document Analyzer", description: "Summarizes PDFs", icon: FileText, active: false },
];

export default function AgentsPage() {
    const [selectedAgentId, setSelectedAgentId] = useState(1);

    const selectedAgent = mockAgents.find((a) => a.id === selectedAgentId);

    return (
        <div className="flex h-full w-full bg-white dark:bg-neutral-900">
            {/* Left Sidebar - Agent List */}
            <div className="w-1/4 min-w-[250px] max-w-[320px] border-r border-neutral-200 dark:border-neutral-800 bg-[#F9F9F9] dark:bg-neutral-900 flex flex-col">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
                    <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        My Agents
                    </h2>
                    <button className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md transition-colors text-neutral-500">
                        <Plus className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-3">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Find agent..."
                            className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:text-neutral-200"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs font-semibold text-neutral-500 mb-2 px-2 uppercase tracking-wider">Configured</div>
                        {mockAgents.map((agent) => (
                            <button
                                key={agent.id}
                                onClick={() => setSelectedAgentId(agent.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left",
                                    selectedAgentId === agent.id
                                        ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium"
                                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400"
                                )}
                            >
                                <agent.icon className="h-4 w-4 shrink-0" />
                                <div className="flex-1 truncate">
                                    <div className="text-sm truncate">{agent.name}</div>
                                </div>
                                {agent.active && (
                                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Pane - Agent Configuration */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-900">
                {selectedAgent ? (
                    <>
                        <header className="px-8 py-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <selectedAgent.icon className="h-8 w-8 text-neutral-700 dark:text-neutral-300" />
                                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                                        {selectedAgent.name}
                                    </h1>
                                </div>
                                <p className="text-neutral-500 dark:text-neutral-400 text-sm">{selectedAgent.description}</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-md text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors">
                                    Test Agent
                                </button>
                                <button className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
                                    Save Changes
                                </button>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto p-8 max-w-4xl">

                            {/* System Prompt */}
                            <section className="mb-10">
                                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
                                    <BrainCircuit className="h-5 w-5 text-neutral-500" />
                                    System Instructions
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                                    Define the core behavior, persona, and primary directives for this agent.
                                </p>
                                <textarea
                                    className="w-full h-40 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:text-neutral-200 resize-none font-mono"
                                    defaultValue={"You are an expert research assistant. Your goal is to synthesize information from the web and provided documents into clear, concise summaries.\n\nAlways cite your sources. Do not make assumptions beyond the provided data."}
                                />
                            </section>

                            {/* Capabilities / Tools */}
                            <section className="mb-10">
                                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
                                    <Settings2 className="h-5 w-5 text-neutral-500" />
                                    Capabilities
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                                    Give this agent access to external tools and system resources.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Web Search Toggle */}
                                    <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                                                <Globe className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">Web Search</div>
                                                <div className="text-xs text-neutral-500">Allow agent to browse the internet</div>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked={selectedAgent.id === 1} />
                                            <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-neutral-900 dark:peer-checked:bg-neutral-200"></div>
                                        </label>
                                    </div>

                                    {/* Terminal Access Toggle */}
                                    <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                                                <TerminalSquare className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">Local Terminal</div>
                                                <div className="text-xs text-neutral-500">Execute commands on your machine</div>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked={selectedAgent.id === 2} />
                                            <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-neutral-900 dark:peer-checked:bg-neutral-200"></div>
                                        </label>
                                    </div>
                                </div>
                            </section>

                            {/* Knowledge Context */}
                            <section className="mb-6">
                                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
                                    <Database className="h-5 w-5 text-neutral-500" />
                                    Knowledge Context
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                                    Connect uploaded documents or specific folders to this agent's immediate memory.
                                </p>

                                <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Connected Sources</span>
                                        <button className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200">Add Source</button>
                                    </div>
                                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {/* Mock Source Item */}
                                        <div className="p-3 flex justify-between items-center bg-white dark:bg-neutral-900">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm text-neutral-700 dark:text-neutral-300">Project_Synapse_Architecture.pdf</span>
                                            </div>
                                            <button className="text-neutral-400 hover:text-red-500 transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        {/* Mock Source Item */}
                                        <div className="p-3 flex justify-between items-center bg-white dark:bg-neutral-900">
                                            <div className="flex items-center gap-3">
                                                <Database className="h-4 w-4 text-purple-500" />
                                                <span className="text-sm text-neutral-700 dark:text-neutral-300">Global Memory Store</span>
                                            </div>
                                            <button className="text-neutral-400 hover:text-red-500 transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Danger Zone */}
                            <section className="pt-8 mt-12 border-t border-neutral-200 dark:border-neutral-800">
                                <h3 className="text-sm font-semibold text-red-600 mb-4 uppercase tracking-wider">Danger Zone</h3>
                                <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50/50 dark:bg-red-900/10">
                                    <div>
                                        <div className="font-medium text-sm text-red-900 dark:text-red-400">Delete Agent</div>
                                        <div className="text-xs text-red-700 dark:text-red-500/70">Permanently remove this agent and its configuration</div>
                                    </div>
                                    <button className="px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/80 transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </section>

                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-neutral-500">
                        Select an agent from the sidebar to configure.
                    </div>
                )}
            </div>
        </div>
    );
}
