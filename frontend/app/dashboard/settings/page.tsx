"use client";

import { Settings, Monitor, Shield, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function SettingsPage() {
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
                            Settings
                        </span>
                    </nav>
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Settings className="h-6 w-6" />
                        Settings
                    </h1>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 space-y-8">
                {/* General Settings */}
                <section>
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-4">
                        <Monitor className="h-5 w-5" />
                        Appearance
                    </h2>
                    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Theme Preference</h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    Switch between light and dark mode.
                                </p>
                            </div>
                            {/* Re-using existing ThemeToggle */}
                            <ThemeToggle />
                        </div>
                    </div>
                </section>

                {/* Local LLM Settings */}
                <section>
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-4">
                        <Zap className="h-5 w-5" />
                        Local LLM Connections
                    </h2>
                    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Ollama URL</h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        Default is usually `http://localhost:11434`
                                    </p>
                                </div>
                                <input
                                    type="text"
                                    disabled
                                    value="http://localhost:11434"
                                    className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm w-64 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data & Privacy */}
                <section>
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-4">
                        <Shield className="h-5 w-5" />
                        Privacy
                    </h2>
                    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 text-center">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Synapse is designed to run entirely offline on your device. Your data and knowledge base stay local.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
