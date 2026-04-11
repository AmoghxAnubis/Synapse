"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, Plus, Settings2, FileText, Globe, Code, BrainCircuit, Trash2, Search, TerminalSquare, Database, Loader2, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAgents, deleteAgent, updateAgent, fetchSources, askSynapse, type Agent, type Source } from "@/lib/api";
import { toast } from "sonner";

const agentIconsMap: Record<string, any> = {
    Bot: Bot,
    Globe: Globe,
    Code: Code,
    FileText: FileText,
};

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Edit state
    const [editedPrompt, setEditedPrompt] = useState("");
    const [editedCapabilities, setEditedCapabilities] = useState({ web_search: false, terminal: false });
    const [editedSources, setEditedSources] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Sources from knowledge base
    const [availableSources, setAvailableSources] = useState<Source[]>([]);

    // Test agent modal
    const [showTestModal, setShowTestModal] = useState(false);
    const [testQuery, setTestQuery] = useState("");
    const [testResult, setTestResult] = useState("");
    const [isTesting, setIsTesting] = useState(false);

    const loadAgents = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchAgents();
            setAgents(data);
            if (data.length > 0 && selectedAgentId === null) {
                setSelectedAgentId(data[0].id);
            }
        } catch {
            toast.error("Failed to load agents");
        } finally {
            setIsLoading(false);
        }
    }, [selectedAgentId]);

    useEffect(() => {
        loadAgents();
        fetchSources().then(data => {
            setAvailableSources(data.filter(s => s.name !== 'user_input' && s.name !== 'web_ui'));
        }).catch(() => {});
    }, []);

    const selectedAgent = agents.find((a) => a.id === selectedAgentId);

    // Sync edit state when selected agent changes
    useEffect(() => {
        if (selectedAgent) {
            setEditedPrompt(selectedAgent.system_instruction || "");
            setEditedCapabilities(selectedAgent.capabilities || { web_search: false, terminal: false });
            setEditedSources(selectedAgent.linked_sources || []);
        }
    }, [selectedAgentId, agents]);

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (id <= 3) return;
        try {
            await deleteAgent(id);
            toast.success("Agent deleted");
            setAgents(prev => {
                const updated = prev.filter(a => a.id !== id);
                if (selectedAgentId === id) {
                    setSelectedAgentId(updated[0]?.id || null);
                }
                return updated;
            });
        } catch {
            toast.error("Failed to delete agent");
        }
    };

    const handleSave = async () => {
        if (!selectedAgent) return;
        setIsSaving(true);
        try {
            const updated = await updateAgent(selectedAgent.id, {
                system_instruction: editedPrompt,
                capabilities: editedCapabilities,
                linked_sources: editedSources,
            });
            setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
            toast.success("Agent saved successfully!");
        } catch {
            toast.error("Failed to save agent");
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestAgent = async () => {
        if (!testQuery.trim() || !selectedAgent) return;
        setIsTesting(true);
        setTestResult("");
        try {
            const response = await askSynapse(testQuery, [], selectedAgent.id);
            setTestResult(response.answer);
        } catch {
            setTestResult("⚠️ Failed to connect to backend.");
        } finally {
            setIsTesting(false);
        }
    };

    const toggleSource = (sourceName: string) => {
        setEditedSources(prev =>
            prev.includes(sourceName)
                ? prev.filter(s => s !== sourceName)
                : [...prev, sourceName]
        );
    };

    const filteredAgents = agents.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full w-full bg-white dark:bg-neutral-900">
            {/* Left Sidebar - Agent List */}
            <div className="w-1/4 min-w-[250px] max-w-[320px] border-r border-neutral-200 dark:border-neutral-800 bg-[#F9F9F9] dark:bg-neutral-900 flex flex-col">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
                    <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        My Agents
                    </h2>
                    <button 
                        onClick={() => window.location.href = '/dashboard/agents/create'}
                        className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md transition-colors text-neutral-500 cursor-pointer"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-3">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Find agent..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:text-neutral-200"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs font-semibold text-neutral-500 mb-2 px-2 uppercase tracking-wider">Configured</div>
                        {isLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                            </div>
                        ) : (
                            filteredAgents.map((agent) => (
                                <button
                                    key={agent.id}
                                    onClick={() => setSelectedAgentId(agent.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left group",
                                        selectedAgentId === agent.id
                                            ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium"
                                            : "hover:bg-neutral-100 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400"
                                    )}
                                >
                                    {(() => {
                                        const Icon = agentIconsMap[agent.icon] || Bot;
                                        return <Icon className="h-4 w-4 shrink-0" />;
                                    })()}
                                    <div className="flex-1 truncate">
                                        <div className="text-sm truncate">{agent.name}</div>
                                    </div>
                                    {agent.id > 3 && (
                                        <Trash2 
                                            className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all" 
                                            onClick={(e) => handleDelete(e, agent.id)}
                                        />
                                    )}
                                    {agent.id <= 3 && (
                                        <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
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
                                    {(() => {
                                        const Icon = agentIconsMap[selectedAgent.icon] || Bot;
                                        return <Icon className="h-8 w-8 text-neutral-700 dark:text-neutral-300" />;
                                    })()}
                                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                                        {selectedAgent.name}
                                    </h1>
                                </div>
                                <p className="text-neutral-500 dark:text-neutral-400 text-sm">{selectedAgent.description}</p>
                                {/* Capability badges */}
                                <div className="flex gap-2 mt-2">
                                    {editedCapabilities.web_search && (
                                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded-full">🌐 Web Search</span>
                                    )}
                                    {editedCapabilities.terminal && (
                                        <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-0.5 rounded-full">⚡ Terminal</span>
                                    )}
                                    {editedSources.length > 0 && (
                                        <span className="text-[10px] font-semibold bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-0.5 rounded-full">📚 {editedSources.length} sources</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => { setShowTestModal(true); setTestResult(""); setTestQuery(""); }}
                                    className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-md text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                                >
                                    Test Agent
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    {isSaving ? "Saving..." : "Save Changes"}
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
                                    key={`agent-sys-inst-${selectedAgent.id}`}
                                    className="w-full h-40 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:text-neutral-200 resize-none font-mono"
                                    value={editedPrompt}
                                    onChange={(e) => setEditedPrompt(e.target.value)}
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
                                            <div className={cn("p-2 rounded-md", editedCapabilities.web_search ? "bg-blue-50 dark:bg-blue-900/20" : "bg-neutral-100 dark:bg-neutral-800")}>
                                                <Globe className={cn("h-5 w-5", editedCapabilities.web_search ? "text-blue-600 dark:text-blue-400" : "text-neutral-600 dark:text-neutral-400")} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">Web Search</div>
                                                <div className="text-xs text-neutral-500">Agent searches the web for context</div>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={editedCapabilities.web_search}
                                                onChange={(e) => setEditedCapabilities(prev => ({ ...prev, web_search: e.target.checked }))}
                                            />
                                            <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
                                        </label>
                                    </div>

                                    {/* Terminal Access Toggle */}
                                    <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-md", editedCapabilities.terminal ? "bg-amber-50 dark:bg-amber-900/20" : "bg-neutral-100 dark:bg-neutral-800")}>
                                                <TerminalSquare className={cn("h-5 w-5", editedCapabilities.terminal ? "text-amber-600 dark:text-amber-400" : "text-neutral-600 dark:text-neutral-400")} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">Local Terminal</div>
                                                <div className="text-xs text-neutral-500">Execute commands on your machine</div>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={editedCapabilities.terminal}
                                                onChange={(e) => setEditedCapabilities(prev => ({ ...prev, terminal: e.target.checked }))}
                                            />
                                            <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600 dark:peer-checked:bg-amber-500"></div>
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
                                    Scope this agent to specific knowledge sources. Leave empty to use all sources.
                                </p>

                                <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                            {editedSources.length === 0 ? "All Sources (default)" : `${editedSources.length} source${editedSources.length > 1 ? 's' : ''} linked`}
                                        </span>
                                        {editedSources.length > 0 && (
                                            <button 
                                                onClick={() => setEditedSources([])}
                                                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-48 overflow-y-auto">
                                        {availableSources.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-neutral-400">
                                                No knowledge sources yet. Upload documents first.
                                            </div>
                                        ) : (
                                            availableSources.map((source) => (
                                                <button
                                                    key={source.name}
                                                    onClick={() => toggleSource(source.name)}
                                                    className="p-3 flex justify-between items-center bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors w-full text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FileText className={cn("h-4 w-4", editedSources.includes(source.name) ? "text-purple-500" : "text-neutral-400")} />
                                                        <div>
                                                            <span className="text-sm text-neutral-700 dark:text-neutral-300">{source.name}</span>
                                                            <span className="text-xs text-neutral-400 ml-2">{source.chunks} chunks</span>
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                                                        editedSources.includes(source.name) 
                                                            ? "bg-purple-600 border-purple-600" 
                                                            : "border-neutral-300 dark:border-neutral-600"
                                                    )}>
                                                        {editedSources.includes(source.name) && (
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Danger Zone */}
                            {selectedAgent.id > 3 && (
                                <section className="pt-8 mt-12 border-t border-neutral-200 dark:border-neutral-800">
                                    <h3 className="text-sm font-semibold text-red-600 mb-4 uppercase tracking-wider">Danger Zone</h3>
                                    <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50/50 dark:bg-red-900/10">
                                        <div>
                                            <div className="font-medium text-sm text-red-900 dark:text-red-400">Delete Agent</div>
                                            <div className="text-xs text-red-700 dark:text-red-500/70">Permanently remove this agent and its configuration</div>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, selectedAgent.id)}
                                            className="px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/80 transition-colors"
                                        >
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

            {/* Test Agent Modal */}
            {showTestModal && selectedAgent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const Icon = agentIconsMap[selectedAgent.icon] || Bot;
                                    return <Icon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />;
                                })()}
                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Test: {selectedAgent.name}</h3>
                            </div>
                            <button onClick={() => setShowTestModal(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md">
                                <X className="h-4 w-4 text-neutral-500" />
                            </button>
                        </div>
                        <div className="p-6">
                            {/* Response Area */}
                            {testResult && (
                                <div className="mb-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 max-h-64 overflow-y-auto">
                                    <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">{testResult}</p>
                                </div>
                            )}
                            {isTesting && (
                                <div className="mb-4 flex items-center gap-2 text-neutral-500 text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Agent is thinking...
                                </div>
                            )}
                            {/* Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={testQuery}
                                    onChange={(e) => setTestQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleTestAgent()}
                                    placeholder="Ask this agent something..."
                                    className="flex-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:text-neutral-200"
                                    disabled={isTesting}
                                />
                                <button
                                    onClick={handleTestAgent}
                                    disabled={isTesting || !testQuery.trim()}
                                    className="px-4 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
