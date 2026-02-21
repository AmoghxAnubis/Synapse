"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

/* ─────────────────────────────────────────────
   FlipCard — scroll-driven 3D card flip
   The card's rotateY is mapped to scroll progress:
   scroll into view → 0° to 180° (front → back)
   scroll back up   → 180° to 0° (back → front)
   ───────────────────────────────────────────── */
function FlipCard({
    num,
    title,
    desc,
    frontBg,
    frontText,
    backBg,
    backText,
    accentClass,
}: {
    num: string;
    title: string;
    desc: string;
    frontBg: string;
    frontText: string;
    backBg: string;
    backText: string;
    accentClass?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);

    // Track scroll progress relative to this card's position
    const { scrollYProgress } = useScroll({
        target: ref,
        // start flipping when the card's top enters the bottom of viewport,
        // finish when the card's top reaches the center of viewport
        offset: ["start end", "start center"],
    });

    // Map scroll progress [0, 1] → rotateY [0°, 180°]
    const rotateY = useTransform(scrollYProgress, [0, 1], [0, 180]);

    // Front face fades out as it passes 90°, back face fades in
    const frontOpacity = useTransform(scrollYProgress, [0, 0.45, 0.55, 1], [1, 1, 0, 0]);
    const backOpacity = useTransform(scrollYProgress, [0, 0.45, 0.55, 1], [0, 0, 1, 1]);

    return (
        <div
            ref={ref}
            className="h-[200px] md:h-[220px]"
            style={{ perspective: 900 }}
        >
            <motion.div
                className="relative h-full w-full rounded-2xl"
                style={{
                    transformStyle: "preserve-3d",
                    rotateY,
                }}
            >
                {/* ── FRONT FACE ── */}
                <motion.div
                    className={`absolute inset-0 flex flex-col justify-between rounded-2xl p-5 md:p-6 ${frontBg} ${frontText}`}
                    style={{ backfaceVisibility: "hidden", opacity: frontOpacity }}
                >
                    <span className="text-[80px] font-black leading-none opacity-15 md:text-[100px]">
                        {num}
                    </span>
                    <h3 className="text-lg font-bold leading-snug md:text-xl">{title}</h3>
                </motion.div>

                {/* ── BACK FACE ── */}
                <motion.div
                    className={`absolute inset-0 flex flex-col justify-between rounded-2xl p-5 md:p-6 ${backBg} ${backText} ${accentClass ?? ""}`}
                    style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        opacity: backOpacity,
                    }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-50">
                            {num}
                        </span>
                        <div className="h-px flex-1 bg-current opacity-10" />
                    </div>
                    <div className="mt-auto">
                        <h3 className="text-base font-bold leading-snug md:text-lg">
                            {title}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed opacity-70 md:text-sm">
                            {desc}
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

/* ═════════════════════════════════════════════
   TECH STACK SECTION
   ═════════════════════════════════════════════ */
export default function TechStackSection() {
    const headerRef = useRef<HTMLDivElement>(null);
    const headerInView = useInView(headerRef, { once: true, margin: "-60px" });

    return (
        <section id="stack" className="relative overflow-hidden bg-white py-32">
            <div className="mx-auto max-w-6xl px-6 md:px-12">
                {/* ─ Top bar ─ */}
                <motion.div
                    ref={headerRef}
                    initial={{ opacity: 0, y: 24 }}
                    animate={headerInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, ease: "easeOut" as const }}
                    className="flex items-end justify-between border-b border-zinc-900 pb-6"
                >
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-400">
                            Infrastructure
                        </p>
                        <h2 className="mt-1 text-5xl font-black tracking-tight text-zinc-950 sm:text-7xl">
                            stack.
                        </h2>
                    </div>
                    <p className="hidden max-w-[220px] text-right text-xs leading-relaxed text-zinc-400 md:block">
                        Every layer engineered
                        <br />
                        for local-first intelligence
                    </p>
                </motion.div>

                {/* ─ Bento Grid ─ */}
                <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                    {/* 01 — Large black hero card (no flip, always visible) */}
                    <motion.div
                        className="group relative col-span-2 flex min-h-[280px] flex-col justify-between overflow-hidden rounded-2xl bg-zinc-950 p-6 text-white md:row-span-2 md:min-h-0 md:p-8"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.6, ease: "easeOut" as const }}
                    >
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                                01
                            </span>
                            <h3 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
                                High-Speed
                                <br />
                                API Engine
                            </h3>
                        </div>
                        <p className="mt-4 max-w-[260px] text-sm leading-relaxed text-zinc-400">
                            Async Python backend handling concurrent requests at blazing speed
                            with zero blocking.
                        </p>
                        {/* Red accent block */}
                        <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-xl bg-red-500 transition-transform duration-500 group-hover:-translate-x-2 group-hover:-translate-y-2" />
                        <div className="absolute -bottom-8 -right-8 h-16 w-16 rounded-lg bg-red-500/30 transition-transform duration-700 group-hover:-translate-x-3 group-hover:-translate-y-3" />
                    </motion.div>

                    {/* 02 — Flip card: white ↔ zinc-900 */}
                    <FlipCard
                        num="02"
                        title="Vector Memory Store"
                        desc="Semantic search database for deep contextual retrieval across all your local files."
                        frontBg="bg-white border border-zinc-200"
                        frontText="text-zinc-900"
                        backBg="bg-zinc-900"
                        backText="text-white"
                    />

                    {/* 03 — Flip card: red ↔ zinc-950 */}
                    <FlipCard
                        num="03"
                        title="Local Language Model"
                        desc="On-device inference — your prompts never leave the machine. Complete privacy by default."
                        frontBg="bg-red-500"
                        frontText="text-white"
                        backBg="bg-zinc-950"
                        backText="text-white"
                        accentClass="ring-1 ring-red-500/30"
                    />

                    {/* 04 — Wide flip card spanning 2 cols */}
                    <div className="col-span-2">
                        <FlipCard
                            num="04"
                            title="Neural Processing Unit"
                            desc="Hardware-accelerated AI inference via dedicated NPU silicon — zero GPU dependency, instant response."
                            frontBg="bg-zinc-50 border border-zinc-200"
                            frontText="text-zinc-900"
                            backBg="bg-white border border-zinc-200"
                            backText="text-zinc-900"
                        />
                    </div>
                </div>

                {/* ─ Bottom divider ─ */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="mt-6 flex items-center gap-3"
                >
                    <div className="h-px flex-1 bg-zinc-200" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
                        Fully local · Zero cloud · Your hardware
                    </p>
                    <div className="h-px flex-1 bg-zinc-200" />
                </motion.div>
            </div>
        </section>
    );
}
