"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

/* ─────────────────────────────────────────────────────
   Card data — all four stack layers
   ───────────────────────────────────────────────────── */
const stackCards = [
    {
        num: "01",
        title: "High-Speed API Engine",
        desc: "Async Python backend handling concurrent requests at blazing speed — zero blocking, maximum throughput.",
        accent: "red",
    },
    {
        num: "02",
        title: "Vector Memory Store",
        desc: "Semantic search database for deep contextual retrieval across all your local files and documents.",
        accent: "zinc",
    },
    {
        num: "03",
        title: "Local Language Model",
        desc: "On-device inference — your prompts never leave the machine. Complete privacy by default.",
        accent: "red",
    },
    {
        num: "04",
        title: "Neural Processing Unit",
        desc: "Hardware-accelerated AI inference via dedicated NPU silicon — zero GPU dependency, instant response.",
        accent: "zinc",
    },
] as const;

/* ─────────────────────────────────────────────────────
   Accent color map for alternating card styles
   ───────────────────────────────────────────────────── */
const accentStyles = {
    red: {
        frontBg: "bg-zinc-950",
        frontText: "text-white",
        frontNumColor: "text-red-500/20",
        backBg: "bg-red-500",
        backText: "text-white",
        backDescOpacity: "text-red-100",
        backNumColor: "text-red-200/40",
        ring: "",
    },
    zinc: {
        frontBg: "bg-white border border-zinc-200",
        frontText: "text-zinc-900",
        frontNumColor: "text-zinc-200",
        backBg: "bg-zinc-900",
        backText: "text-white",
        backDescOpacity: "text-zinc-400",
        backNumColor: "text-zinc-700",
        ring: "",
    },
} as const;

/* ─────────────────────────────────────────────────────
   FlipCard — scroll-position-driven 3D flip
   Scroll down → flips front to back (0° → 180°)
   Scroll back → reverses the flip   (180° → 0°)
   ───────────────────────────────────────────────────── */
function FlipCard({
    num,
    title,
    desc,
    accent,
}: {
    num: string;
    title: string;
    desc: string;
    accent: "red" | "zinc";
}) {
    const ref = useRef<HTMLDivElement>(null);
    const s = accentStyles[accent];

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "start center"],
    });

    const rotateY = useTransform(scrollYProgress, [0, 1], [0, 180]);
    const frontOpacity = useTransform(
        scrollYProgress,
        [0, 0.42, 0.58, 1],
        [1, 1, 0, 0]
    );
    const backOpacity = useTransform(
        scrollYProgress,
        [0, 0.42, 0.58, 1],
        [0, 0, 1, 1]
    );

    return (
        <div
            ref={ref}
            className="h-[240px] sm:h-[260px]"
            style={{ perspective: 1000 }}
        >
            <motion.div
                className="relative h-full w-full will-change-transform"
                style={{ transformStyle: "preserve-3d", rotateY }}
            >
                {/* ── FRONT ── */}
                <motion.div
                    className={`absolute inset-0 flex flex-col justify-between rounded-2xl p-6 ${s.frontBg} ${s.frontText}`}
                    style={{ backfaceVisibility: "hidden", opacity: frontOpacity }}
                >
                    <span
                        className={`text-[90px] font-black leading-none sm:text-[110px] ${s.frontNumColor}`}
                    >
                        {num}
                    </span>
                    <h3 className="text-xl font-bold leading-snug sm:text-2xl">
                        {title}
                    </h3>
                </motion.div>

                {/* ── BACK ── */}
                <motion.div
                    className={`absolute inset-0 flex flex-col justify-between rounded-2xl p-6 ${s.backBg} ${s.backText} ${s.ring}`}
                    style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        opacity: backOpacity,
                    }}
                >
                    <div className="flex items-center gap-3">
                        <span
                            className={`text-[48px] font-black leading-none sm:text-[56px] ${s.backNumColor}`}
                        >
                            {num}
                        </span>
                        <div className="h-px flex-1 bg-current opacity-10" />
                    </div>
                    <div className="mt-auto">
                        <h3 className="text-lg font-bold leading-snug">{title}</h3>
                        <p className={`mt-2 text-sm leading-relaxed ${s.backDescOpacity}`}>
                            {desc}
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════
   TECH STACK SECTION
   ═════════════════════════════════════════════════════ */
export default function TechStackSection() {
    const headerRef = useRef<HTMLDivElement>(null);
    const headerInView = useInView(headerRef, { once: true, margin: "-60px" });

    return (
        <section id="stack" className="relative overflow-hidden bg-white py-32">
            <div className="mx-auto max-w-6xl px-6 md:px-12">
                {/* ─ Header ─ */}
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

                {/* ─ Uniform 2×2 Grid ─ */}
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {stackCards.map((card) => (
                        <FlipCard key={card.num} {...card} />
                    ))}
                </div>

                {/* ─ Bottom divider ─ */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
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
