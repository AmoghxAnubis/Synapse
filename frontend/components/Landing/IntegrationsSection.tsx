"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { GitPullRequest, MessageSquare, BookOpen, LayoutGrid, Plug, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/* ──────────────────── Fade In Wrapper ──────────────────── */
function FadeIn({
    children,
    delay = 0,
    className,
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.5, delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

const integrations = [
    {
        icon: GitPullRequest,
        name: "GitHub",
        desc: "Sync repositories, pull requests, issues, and code reviews into local memory.",
        tag: "Code & Reviews",
        syncText: "Pulling commits...",
    },
    {
        icon: MessageSquare,
        name: "Slack",
        desc: "Pull saved messages, channel threads, and team conversations for contextual answers.",
        tag: "Messages & Threads",
        syncText: "Ingesting messages...",
    },
    {
        icon: BookOpen,
        name: "Notion",
        desc: "Ingest workspace docs, databases, meeting notes, and wikis for deep RAG queries.",
        tag: "Docs & Databases",
        syncText: "Indexing pages...",
    },
    {
        icon: LayoutGrid,
        name: "Jira",
        desc: "Sync active sprint tickets, epics, stories, and bug reports into your knowledge base.",
        tag: "Sprints & Tickets",
        syncText: "Syncing tickets...",
    },
];

function IntegrationCard({ int, delay }: { int: typeof integrations[0]; delay: number }) {
    const [isHovered, setIsHovered] = useState(false);

    // Mouse tracking for spotlight effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <FadeIn delay={delay}>
            <Card
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group relative overflow-hidden rounded-2xl border flex flex-col justify-between border-zinc-200/50 bg-white/60 p-6 shadow-sm backdrop-blur-xl transition-all duration-500 hover:border-zinc-300/80 hover:bg-white/90 hover:shadow-xl hover:shadow-zinc-200/50"
            >
                {/* Spotlight Gradient */}
                <motion.div
                    className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-500 group-hover:opacity-100"
                    style={{
                        background: useMotionTemplate`
                            radial-gradient(
                                300px circle at ${mouseX}px ${mouseY}px,
                                rgba(161, 161, 170, 0.08),
                                transparent 80%
                            )
                        `,
                    }}
                />

                {/* Grid Pattern Background - appears on hover */}
                <div
                    className="pointer-events-none absolute inset-0 -z-10 opacity-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:12px_12px] transition-opacity duration-700 group-hover:opacity-100"
                />

                <div className="relative z-10 flex items-start gap-4">
                    {/* Icon */}
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-zinc-600 ring-1 ring-black/[0.04] overflow-hidden">
                        <motion.div
                            animate={{
                                scale: isHovered ? [1, 1.2, 1] : 1,
                                rotate: isHovered ? [0, 5, -5, 0] : 0
                            }}
                            transition={{ duration: 0.5 }}
                        >
                            <int.icon className="absolute inset-0 m-auto h-5 w-5 text-zinc-900 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            <int.icon className="h-5 w-5 transition-opacity duration-300 group-hover:opacity-0" />
                        </motion.div>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-zinc-900">{int.name}</h3>
                            <Badge
                                variant="secondary"
                                className="border border-zinc-200/80 bg-zinc-50/50 text-[10px] font-semibold text-zinc-500 backdrop-blur-sm transition-colors duration-300 group-hover:border-zinc-300 group-hover:bg-white group-hover:text-zinc-700"
                            >
                                {int.tag}
                            </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-500 transition-colors duration-300 group-hover:text-zinc-700">
                            {int.desc}
                        </p>

                        {/* Dynamic Status Bar */}
                        <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 transition-colors duration-300 group-hover:border-zinc-200">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2 items-center justify-center">
                                    {isHovered ? (
                                        <>
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                        </>
                                    ) : (
                                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-zinc-300"></span>
                                    )}
                                </span>
                                <span className={`text-[11px] font-medium transition-colors duration-300 ${isHovered ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                    {isHovered ? int.syncText : "Ready to connect"}
                                </span>
                            </div>

                            {/* Simulated Progress Bar (Visible on Hover) */}
                            <div className="h-1 w-12 overflow-hidden rounded-full bg-zinc-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <motion.div
                                    className="h-full bg-emerald-400"
                                    initial={{ x: "-100%" }}
                                    animate={isHovered ? { x: ["-100%", "200%"] } : { x: "-100%" }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 1.5,
                                        ease: "linear"
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </FadeIn>
    );
}

export default function IntegrationsSection() {
    return (
        <section id="integrations" className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-50/50 py-32">

            {/* Ambient background glows */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[40rem] w-[40rem] rounded-full bg-zinc-200/20 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-5xl px-6 md:px-12">
                {/* Header */}
                <FadeIn className="flex flex-col items-center text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                        Integrations
                    </p>
                    <h2 className="mt-3 max-w-md text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:max-w-xl">
                        Pull your world into Synapse
                    </h2>
                    <p className="mt-5 max-w-lg text-sm text-zinc-500 sm:text-base">
                        Connect your platforms and let Synapse ingest PRs, messages,
                        docs, and tickets into local ChromaDB — zero cloud leakage.
                    </p>
                </FadeIn>

                {/* Cards — 2×2 */}
                <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:gap-6">
                    {integrations.map((int, i) => (
                        <IntegrationCard key={int.name} int={int} delay={i * 0.1} />
                    ))}
                </div>

                {/* CTA */}
                <FadeIn delay={0.4} className="mt-16 flex flex-col items-center text-center">
                    <Link href="/settings/integrations">
                        <Button
                            size="lg"
                            className="group relative overflow-hidden rounded-full bg-zinc-900 px-8 py-6 text-base font-medium text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-xl hover:shadow-zinc-900/20"
                        >
                            <span className="relative z-10 flex items-center">
                                <Plug className="mr-2 h-4 w-4 transition-transform group-hover:-rotate-12" />
                                Connect Your Tools
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </span>
                        </Button>
                    </Link>
                    <div className="mt-6 flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/50 px-4 py-2 text-xs text-zinc-500 backdrop-blur-sm">
                        <Shield className="h-3.5 w-3.5 text-zinc-400" />
                        API keys stay on your machine. Data is pulled, never pushed.
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}
