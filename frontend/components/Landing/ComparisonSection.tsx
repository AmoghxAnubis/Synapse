"use client";

import { motion } from "framer-motion";
import {
    Shield,
    BrainCircuit,
    Cpu,
    Layers,
    XCircle,
    CheckCircle2,
    type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ──────────────────── Comparison data ──────────────────── */
const comparisonData: {
    title: string;
    icon: LucideIcon;
    bad: string;
    good: string;
}[] = [
        {
            title: "Data Privacy",
            icon: Shield,
            bad: "Sends private context to public cloud servers. Local OS search is shallow and disconnected.",
            good: "Zero-Knowledge Local RAG. Your data never leaves the device — ever.",
        },
        {
            title: "Context Depth",
            icon: BrainCircuit,
            bad: "Great reasoning, but blind to local files. OS search matches filenames, not meaning.",
            good: "Full Semantic Memory. Understands your PDFs, code, and docs at a deep level.",
        },
        {
            title: "Latency & Speed",
            icon: Cpu,
            bad: "Dependent on internet and server load. Complex queries stall behind queues.",
            good: "Hardware Accelerated. Instant response via local NPU/GPU — zero network round-trip.",
        },
        {
            title: "OS Action",
            icon: Layers,
            bad: "A passive chatbot that can't touch your system. OS search opens apps, nothing more.",
            good: "Active Orchestrator. Switches modes, manages windows & launches tools on your behalf.",
        },
    ];

/* ══════════════════════════════════════════════════════════
   COMPARISON SECTION
   ══════════════════════════════════════════════════════════ */
export default function ComparisonSection() {
    return (
        <section
            id="comparison"
            className="relative overflow-hidden border-y border-zinc-200 bg-gradient-to-b from-zinc-50 via-white to-zinc-50 py-28"
        >
            {/* Lightweight decorative accents (no blur — perf optimized) */}
            <div className="pointer-events-none absolute -top-32 left-1/4 h-[400px] w-[400px] rounded-full bg-emerald-50/40" />
            <div className="pointer-events-none absolute -bottom-32 right-1/4 h-[350px] w-[350px] rounded-full bg-purple-50/30" />

            <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-12">
                {/* ─── Header ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, ease: "easeOut" as const }}
                    className="mb-14 flex flex-col items-center text-center"
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Why Synapse
                    </p>
                    <h2 className="mt-3 max-w-lg text-3xl font-bold tracking-tight sm:text-4xl">
                        The Cost of Fragmented Context
                    </h2>
                    <p className="mt-4 max-w-md text-zinc-500">
                        Stop pasting private data into cloud chat windows.
                        <br className="hidden sm:block" />
                        Start owning your intelligence.
                    </p>
                </motion.div>

                {/* ─── Column Headers ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, ease: "easeOut" as const }}
                    className="mb-4 hidden grid-cols-[1fr_1fr_1fr] items-end gap-4 px-2 md:grid"
                >
                    <div />
                    <div className="flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-zinc-100/80 px-4 py-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                            Existing Solutions
                        </span>
                    </div>
                    <div className="flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                            Synapse Core
                        </span>
                    </div>
                </motion.div>

                {/* ─── Comparison Rows ─── */}
                <div className="space-y-4 relative z-20">
                    {comparisonData.map((item, i) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-30px" }}
                            transition={{
                                duration: 0.5,
                                delay: i * 0.08,
                                ease: "easeOut" as const,
                            }}
                            className="group relative overflow-hidden grid grid-cols-1 gap-3 rounded-[1.5rem] border border-zinc-200/60 bg-white p-4 transition-all duration-500 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-2xl hover:shadow-zinc-200/50 md:grid-cols-[1fr_1fr_1fr] md:items-center md:gap-4 md:p-5"
                        >
                            {/* Glow & Pattern Background */}
                            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-400/20 opacity-0 blur-[40px] transition-all duration-700 group-hover:scale-150 group-hover:opacity-100" />
                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                            {/* Label column */}
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-600 shadow-sm transition-transform duration-500 group-hover:scale-110">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <h4 className="text-sm font-bold tracking-tight text-zinc-900">
                                    {item.title}
                                </h4>
                            </div>

                            {/* "Bad" — Existing solutions */}
                            <div className="relative z-10 flex h-full items-start gap-3 rounded-2xl bg-zinc-50/80 p-4 transition-colors duration-300 group-hover:bg-zinc-100/50 md:p-4">
                                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400/60 transition-transform duration-300 group-hover:scale-110 group-hover:text-red-400" />
                                <p className="text-[13px] leading-relaxed text-zinc-500">
                                    {item.bad}
                                </p>
                            </div>

                            {/* "Good" — Synapse */}
                            <div className="relative z-10 flex h-full items-start gap-3 rounded-2xl bg-emerald-50/60 p-4 ring-1 ring-emerald-100/50 transition-colors duration-300 group-hover:bg-emerald-50 md:p-4">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500 transition-transform duration-300 group-hover:scale-110 group-hover:text-emerald-600" />
                                <p className="text-[13px] font-medium leading-relaxed text-zinc-700">
                                    {item.good}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ─── Bottom accent ─── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" as const }}
                    className="mt-8 flex justify-center"
                >
                    <Badge
                        variant="secondary"
                        className="gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2 text-xs font-medium text-zinc-500 shadow-sm"
                    >
                        <Shield className="h-3.5 w-3.5 text-emerald-500" />
                        100% local inference · zero cloud leakage · your hardware, your data
                    </Badge>
                </motion.div>
            </div>
        </section>
    );
}
