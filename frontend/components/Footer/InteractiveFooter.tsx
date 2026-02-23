"use client";

import dynamic from "next/dynamic";
import FooterCTA from "./FooterCTA";

const SynapticCanvas = dynamic(() => import("./SynapticCanvas"), {
    ssr: false,
});

export default function InteractiveFooter() {
    return (
        <section className="relative h-[60vh] w-full border-t border-zinc-200 bg-zinc-50/50 dark:border-white/10 dark:bg-zinc-950/50">
            {/* 3D canvas background */}
            <SynapticCanvas />

            {/* HTML overlay */}
            <FooterCTA />
        </section>
    );
}
