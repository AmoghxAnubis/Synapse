"use client";

import { motion } from "framer-motion";
import { Shield, BrainCircuit, Cpu, Layers } from "lucide-react";
import ComparisonFeatureRow from "./ComparisonFeatureRow";

/* ──────────────────── Comparison data ──────────────────── */
const comparisonData = [
    {
        title: "Data Privacy",
        categoryIcon: Shield,
        competitorDescription:
            "Sends private context to public cloud servers. Traditional OS search is local, but shallow.",
        synapseDescription:
            "Zero-Knowledge Local RAG. Data never leaves the device.",
    },
    {
        title: "Context Depth",
        categoryIcon: BrainCircuit,
        competitorDescription:
            "Cloud AI has great reasoning but can't see your files. OS search finds filenames, not meaning.",
        synapseDescription:
            "Full Semantic Memory. Understands local PDFs, code, and docs at a deep level.",
    },
    {
        title: "Latency & Speed",
        categoryIcon: Cpu,
        competitorDescription:
            "Dependent on internet connection and server load. Simple queries are fast, complex ones stall.",
        synapseDescription:
            "Hardware Accelerated. Instant response via local NPU/GPU — no network round-trip.",
    },
    {
        title: "OS Action",
        categoryIcon: Layers,
        competitorDescription:
            "Cloud AI is a passive chatbot. OS search can open apps, but can't execute complex workflows.",
        synapseDescription:
            "Active Orchestrator. Switches modes, manages windows & tools on your behalf.",
    },
];

/* ──────────────────── Animation variants ──────────────────── */
const panelVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (delay: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, delay, ease: "easeOut" as const },
    }),
};

/* ══════════════════════════════════════════════════════════
   COMPARISON SECTION
   ══════════════════════════════════════════════════════════ */
export default function ComparisonSection() {
    return (
        <section
            id="comparison"
            className="relative overflow-hidden bg-zinc-950 py-24"
        >
            {/* Background texture — faint grid */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
                    backgroundSize: "64px 64px",
                }}
            />

            {/* Gradient orbs for depth */}
            <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.06] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-purple-500/[0.06] blur-3xl" />

            <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-12">
                {/* ─── Header ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 flex flex-col items-center text-center"
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Why Synapse
                    </p>
                    <h2 className="mt-3 max-w-lg text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        The Cost of Fragmented Context.
                    </h2>
                    <p className="mt-4 max-w-lg text-zinc-400">
                        Stop pasting private data into cloud chat windows. Start owning
                        your intelligence.
                    </p>
                </motion.div>

                {/* ─── Two-Column Grid ─── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Left Panel — Existing Solutions (dimmer) */}
                    <motion.div
                        custom={0.1}
                        variants={panelVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-40px" }}
                        className="glass-dark-dim rounded-2xl p-6 md:p-8"
                    >
                        {/* Panel header */}
                        <div className="mb-6 flex items-center gap-3 border-b border-white/[0.06] pb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
                                <span className="text-sm">⚠️</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-300">
                                    Existing Solutions
                                </h3>
                                <p className="text-xs text-zinc-500">
                                    Cloud AI & Traditional OS Search
                                </p>
                            </div>
                        </div>

                        {/* Feature rows — competitor side */}
                        <div className="space-y-4">
                            {comparisonData.map((item) => (
                                <div
                                    key={item.title}
                                    className="border-b border-white/[0.04] pb-4 last:border-b-0 last:pb-0"
                                >
                                    <div className="mb-2 flex items-center gap-2">
                                        <item.categoryIcon className="h-3.5 w-3.5 text-zinc-600" />
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                                            {item.title}
                                        </span>
                                    </div>
                                    <p className="text-sm leading-relaxed text-zinc-500">
                                        {item.competitorDescription}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Panel — Synapse (glowing, premium) */}
                    <motion.div
                        custom={0.25}
                        variants={panelVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-40px" }}
                        className="glass-dark glow-synapse rounded-2xl p-6 md:p-8"
                    >
                        {/* Panel header */}
                        <div className="mb-6 flex items-center gap-3 border-b border-emerald-500/10 pb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-purple-500/20">
                                <span className="text-sm">⚡</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">
                                    Synapse Core
                                </h3>
                                <p className="text-xs text-emerald-400/70">
                                    Local Unified Intelligence
                                </p>
                            </div>
                        </div>

                        {/* Feature rows — Synapse side */}
                        <div className="space-y-4">
                            {comparisonData.map((item) => (
                                <ComparisonFeatureRow
                                    key={item.title}
                                    title={item.title}
                                    competitorDescription={item.competitorDescription}
                                    synapseDescription={item.synapseDescription}
                                    categoryIcon={item.categoryIcon}
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
