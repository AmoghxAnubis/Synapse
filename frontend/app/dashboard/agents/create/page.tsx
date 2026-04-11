"use client";

import { useRouter } from "next/navigation";
import { Bot, ArrowLeft, BrainCircuit, AlignLeft, Sparkles, Globe, TerminalSquare, FileText, Code } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { createAgent } from "@/lib/api";
import { toast } from "sonner";

const ICONS = [
    { name: "Bot (Default)", icon: Bot, iconName: "Bot" },
    { name: "Globe (Research)", icon: Globe, iconName: "Globe" },
    { name: "Code (Development)", icon: Code, iconName: "Code" },
    { name: "FileText (Document)", icon: FileText, iconName: "FileText" },
];

export default function CreateAgentPage() {
    const router = useRouter();
    const [selectedIconIdx, setSelectedIconIdx] = useState(0);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [systemInstruction, setSystemInstruction] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name || !systemInstruction) {
            toast.error("Name and System Instructions are required");
            return;
        }

        setIsSaving(true);
        try {
            await createAgent({
                name,
                description,
                system_instruction: systemInstruction,
                icon: ICONS[selectedIconIdx].iconName
            });
            toast.success("Agent created successfully!");
            router.push('/dashboard/agents');
        } catch (err) {
            toast.error("Failed to create agent");
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* Page Header */}
            <header className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/dashboard/agents')}
                        className="p-2 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <nav className="text-sm text-neutral-500 font-medium mb-1">
                            <span className="hover:text-neutral-800 cursor-pointer dark:text-neutral-400 dark:hover:text-neutral-200" onClick={() => router.push('/dashboard')}>
                                Synapse
                            </span>
                            <span className="mx-2">/</span>
                            <span className="hover:text-neutral-800 cursor-pointer dark:text-neutral-400 dark:hover:text-neutral-200" onClick={() => router.push('/dashboard/agents')}>
                                Agents
                            </span>
                            <span className="mx-2">/</span>
                            <span className="text-neutral-900 dark:text-neutral-100">
                                Create
                            </span>
                        </nav>
                        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-indigo-500" />
                            Create New Agent
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-md text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving && <BrainCircuit className="h-4 w-4 animate-spin" />}
                        {isSaving ? "Saving..." : "Save & Create"}
                    </button>
                </div>
            </header>

            {/* Main Form Area */}
            <div className="flex-1 overflow-y-auto w-full max-w-3xl pb-8">
                <div className="space-y-8">
                    {/* Basic Info */}
                    <section>
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                            <AlignLeft className="h-5 w-5 text-neutral-500" />
                            General Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Agent Name</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Content Writer"
                                    className="w-full bg-white dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:text-neutral-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Short Description</label>
                                <input 
                                    type="text" 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g. Helps in writing blog posts and tweets"
                                    className="w-full bg-white dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:text-neutral-200"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Agent Icon */}
                    <section>
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                            Select Icon
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {ICONS.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedIconIdx(idx)}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-all cursor-pointer",
                                        selectedIconIdx === idx 
                                            ? "border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-800" 
                                            : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900"
                                    )}
                                    type="button"
                                >
                                    <item.icon className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
                                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{item.name}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* System Prompt */}
                    <section>
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
                            <BrainCircuit className="h-5 w-5 text-neutral-500" />
                            System Instructions
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                            Define the persona, role, and rules your agent must follow.
                        </p>
                        <textarea
                            value={systemInstruction}
                            onChange={(e) => setSystemInstruction(e.target.value)}
                            placeholder="You are an expert... Your main focus is to..."
                            className="w-full h-48 bg-white dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:text-neutral-200 resize-none font-mono"
                        />
                    </section>

                    {/* Initial Access */}
                    <section>
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                            <TerminalSquare className="h-5 w-5 text-neutral-500" />
                            Capabilities Context (Optional)
                        </h3>
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
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-neutral-900 dark:peer-checked:bg-neutral-200"></div>
                                </label>
                            </div>

                            {/* Local Terminal Toggle */}
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
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-neutral-900 dark:peer-checked:bg-neutral-200"></div>
                                </label>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
