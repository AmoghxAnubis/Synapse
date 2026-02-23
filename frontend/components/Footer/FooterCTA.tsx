"use client";

import Link from "next/link";
import { ArrowRight, Brain, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FooterCTA() {
    return (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
            <div className="flex flex-col items-center text-center">
                {/* Icon */}
                <div className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/60 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-xl dark:bg-black/20 dark:ring-white/10">
                    <Brain className="h-6 w-6 text-zinc-700 dark:text-zinc-300" />
                </div>

                {/* Heading */}
                <h2 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">
                    Ready to deploy your local AI?
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Start the backend, open the dashboard, and let Synapse orchestrate
                    your workflow — entirely on your machine.
                </p>

                {/* CTA button */}
                <div className="pointer-events-auto mt-8 flex gap-3">
                    <Link href="/dashboard">
                        <Button
                            size="lg"
                            className="rounded-full bg-foreground px-8 text-base font-medium text-white shadow-lg shadow-black/5 hover:bg-foreground/90 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            Open Dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {/* Command snippet */}
                <div className="pointer-events-auto mt-8 rounded-xl border border-white/80 bg-white/60 px-5 py-3 font-mono text-sm text-zinc-600 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                    <Terminal className="mr-2 inline h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                    <span className="text-zinc-900 dark:text-zinc-100">$</span> cd backend && python -m
                    uvicorn app.main:app --reload
                </div>
            </div>
        </div>
    );
}
