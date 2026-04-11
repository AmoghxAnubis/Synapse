"use client";

import { useState, useEffect } from "react";
import { Bot, Plus, Settings2, FileText, Globe, Code, BrainCircuit, Trash2, Search, TerminalSquare, Database, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAgents, type Agent } from "@/lib/api";

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const res = await getAgents();
                setAgents(res.agents);
                if (res.agents.length > 0) {
                    setSelectedAgentId(res.agents[0].id);
                }
            } catch (err) {
                console.error("Failed to fetch agents:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAgents();
    }, []);

    const selectedAgent = agents.find((a) => a.id === selectedAgentId);

    // Helper to render correct icon
    const AgentIcon = ({ icon, className }: { icon: string, className?: string }) => {
        switch (icon) {
            case "Globe": return <Globe className={className} />;
            case "Code": return <Code className={className} />;
            case "FileText": return <FileText className={className} />;
            default: return <Bot className={className} />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-white dark:bg-neutral-900">
                <div className="flex flex-col items-center gap-3">
                    <Bot className="h-8 w-8 animate-bounce text-neutral-400" />
                    <p className="text-sm text-neutral-500">Loading your agents...</p>
                </div>
            </div>
        );
    }

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
                        {agents.map((agent) => (
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
                                <AgentIcon icon={agent.icon} className="h-4 w-4 shrink-0" />
                                <div className="flex-1 truncate">
                                    <div className="text-sm truncate">{agent.name}</div>
                                </div>
                                {agent.connected && (
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
                                    <AgentIcon icon={selectedAgent.icon} className="h-8 w-8 text-neutral-700 dark:text-neutral-300" />
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                                            {selectedAgent.name}
                                        </h1>
                                        {selectedAgent.type === "platform" && (
                                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-600 font-bold uppercase tracking-tight">System</span>
                                        )}
                                    </div>
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

                            {/* Connection Status */}
                            <section className="mb-10">
                                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
                                    <Settings2 className="h-5 w-5 text-neutral-500" />
                                    Connection Status
                                </h3>
                                <div className={cn(
                                    "flex items-center gap-3 p-4 rounded-xl border",
                                    selectedAgent.connected
                                        ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30"
                                        : "bg-rose-50/50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30"
                                )}>
                                    {selectedAgent.connected ? (
                                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                    ) : (
                                        <XCircle className="h-6 w-6 text-rose-500" />
                                    )}
                                    <div>
                                        <p className={cn(
                                            "text-sm font-semibold",
                                            selectedAgent.connected ? "text-emerald-800 dark:text-emerald-400" : "text-rose-800 dark:text-rose-400"
                                        )}>
                                            {selectedAgent.connected ? "Agent Online & Ready" : "Agent Offline"}
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                            {selectedAgent.connected
                                                ? `Synapse has successfully established a link with ${selectedAgent.name}.`
                                                : `Initialization failed. Please check your environment configuration for ${selectedAgent.name}.`}
                                        </p>
                                    </div>
                                </div>
                            </section>

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
                                    defaultValue={selectedAgent.type === "persona" ? "Detected persona instructions..." : "Default system routing logic active."}
                                    readOnly={selectedAgent.type === "platform"}
                                />
                            </section>

                            {/* Capabilities / Tools */}
                            <section className="mb-10">
                                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
                                    <TerminalSquare className="h-5 w-5 text-neutral-500" />
                                    Capabilities
                                </h3 >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Mock Capability */}
                                    <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 opacity-60">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                                                <Globe className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">Web Search</div>
                                                <div className="text-xs text-neutral-500">Allow agent to search the web</div>
                                            </div>
                                        </div>
                                        <div className="w-9 h-5 bg-neutral-200 rounded-full"></div>
                                    </div>
                                    {/* Mock Capability */}
                                    <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 opacity-60">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                                                <Database className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">Memory Write</div>
                                                <div className="text-xs text-neutral-500">Allow agent to store new records</div>
                                            </div>
                                        </div>
                                        <div className="w-9 h-5 bg-neutral-200 rounded-full"></div>
                                    </div>
                                </div>
                            </section>

                            {/* Danger Zone */}
                            {selectedAgent.type === "persona" && (
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
                            )}

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
