"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Brain,
    GitPullRequest,
    MessageSquare,
    BookOpen,
    LayoutGrid,
    Settings,
} from "lucide-react";
import Link from "next/link";
import IntegrationCard, {
    type IntegrationStatus,
} from "@/components/IntegrationCard";
import ConnectModal from "@/components/ConnectModal";
import SyncLog, { type SyncLogEntry } from "@/components/SyncLog";
import {
    saveIntegrationKey,
    triggerSync,
    type Platform,
} from "@/lib/api";

/* ─── Integration definitions ─────────────────────────── */

interface Integration {
    id: Platform;
    name: string;
    description: string;
    icon: React.ReactNode;
    accentColor: string;
}

const integrations: Integration[] = [
    {
        id: "github",
        name: "GitHub",
        description:
            "Sync repositories & pull requests. Ingest code reviews, issues, and commit history into local memory.",
        icon: <GitPullRequest className="h-5 w-5" />,
        accentColor: "purple",
    },
    {
        id: "slack",
        name: "Slack",
        description:
            "Sync saved messages & channel context. Pull important conversations and threads into Synapse's brain.",
        icon: <MessageSquare className="h-5 w-5" />,
        accentColor: "orange",
    },
    {
        id: "notion",
        name: "Notion",
        description:
            "Sync workspace docs & notes. Ingest pages, databases, and meeting notes for contextual RAG.",
        icon: <BookOpen className="h-5 w-5" />,
        accentColor: "blue",
    },
    {
        id: "jira",
        name: "Jira",
        description:
            "Sync active sprint tickets. Pull epics, stories, and bug reports into your local knowledge base.",
        icon: <LayoutGrid className="h-5 w-5" />,
        accentColor: "blue",
    },
];

/* ─── Page component ─────────────────────────────────── */

export default function IntegrationsPage() {
    // State: connection + toggle per platform
    const [statuses, setStatuses] = useState<
        Record<Platform, IntegrationStatus>
    >({
        github: "disconnected",
        slack: "disconnected",
        notion: "disconnected",
        jira: "disconnected",
    });

    const [activeToggles, setActiveToggles] = useState<
        Record<Platform, boolean>
    >({
        github: true,
        slack: true,
        notion: true,
        jira: true,
    });

    const [lastSynced, setLastSynced] = useState<
        Record<Platform, string | undefined>
    >({
        github: undefined,
        slack: undefined,
        notion: undefined,
        jira: undefined,
    });

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalPlatform, setModalPlatform] = useState<Integration | null>(null);

    // Sync log
    const [logs, setLogs] = useState<SyncLogEntry[]>([]);

    const addLog = useCallback(
        (platform: string, message: string, type: SyncLogEntry["type"] = "info") => {
            const now = new Date();
            const ts = now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            });
            setLogs((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    timestamp: ts,
                    platform,
                    message,
                    type,
                },
            ]);
        },
        []
    );

    // Handlers
    const handleConnect = (integration: Integration) => {
        setModalPlatform(integration);
        setModalOpen(true);
    };

    const handleKeySubmit = async (key: string) => {
        if (!modalPlatform) return;
        const pid = modalPlatform.id;

        await saveIntegrationKey(pid, key);
        setStatuses((prev) => ({ ...prev, [pid]: "connected" }));
        addLog(modalPlatform.name, "API key saved. Integration connected.", "success");
    };

    const handleSync = async (integration: Integration) => {
        const pid = integration.id;

        setStatuses((prev) => ({ ...prev, [pid]: "syncing" }));
        addLog(integration.name, "Starting sync...", "info");

        try {
            const result = await triggerSync(pid);
            setStatuses((prev) => ({ ...prev, [pid]: "connected" }));

            const now = new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
            setLastSynced((prev) => ({ ...prev, [pid]: now }));

            addLog(
                integration.name,
                `Ingested ${result.documents_ingested} documents → Chunked into ${result.chunks_created} vectors.`,
                "success"
            );
        } catch {
            setStatuses((prev) => ({ ...prev, [pid]: "connected" }));
            addLog(integration.name, "Sync failed. Backend unreachable.", "error");
        }
    };

    const handleToggle = (pid: Platform, active: boolean) => {
        setActiveToggles((prev) => ({ ...prev, [pid]: active }));
        const name = integrations.find((i) => i.id === pid)?.name ?? pid;
        addLog("System", `${name} integration ${active ? "enabled" : "disabled"}.`, "info");
    };

    return (
        <div className="relative min-h-screen bg-white">
            {/* Subtle grid bg */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)",
                    backgroundSize: "64px 64px",
                }}
            />

            {/* Top bar */}
            <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-6 py-3 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-foreground"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Dashboard
                    </Link>
                    <div className="h-4 w-px bg-zinc-200" />
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
                            <Settings className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-sm font-bold tracking-tight">
                            Integrations
                        </span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="relative mx-auto max-w-5xl px-6 py-10">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                        Connected Brains
                    </h1>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-500">
                        Sync your external workspaces into Synapse's local memory. All data
                        is pulled down and processed by your local NPU — nothing leaves your
                        machine.
                    </p>
                </motion.div>

                {/* Integration Cards Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2"
                >
                    {integrations.map((integration, i) => (
                        <motion.div
                            key={integration.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                        >
                            <IntegrationCard
                                name={integration.name}
                                description={integration.description}
                                icon={integration.icon}
                                accentColor={integration.accentColor}
                                status={statuses[integration.id]}
                                lastSynced={lastSynced[integration.id]}
                                isActive={activeToggles[integration.id]}
                                onConnect={() => handleConnect(integration)}
                                onSync={() => handleSync(integration)}
                                onToggle={(active) => handleToggle(integration.id, active)}
                            />
                        </motion.div>
                    ))}
                </motion.div>

                {/* Sync Log */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="mt-10"
                >
                    <SyncLog entries={logs} />
                </motion.div>

                {/* Privacy footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 text-center"
                >
                    <p className="text-xs text-zinc-400">
                        🔒 Zero cloud leakage — all synced data is stored exclusively in
                        your local ChromaDB vector store.
                    </p>
                </motion.div>
            </main>

            {/* Connect Modal */}
            {modalPlatform && (
                <ConnectModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    platformName={modalPlatform.name}
                    platformIcon={modalPlatform.icon}
                    onSubmit={handleKeySubmit}
                />
            )}
        </div>
    );
}
