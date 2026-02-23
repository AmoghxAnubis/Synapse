"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, MotionValue } from "framer-motion";

const stackCards = [
    {
        num: "01",
        title: "High-Speed API Engine",
        subtitle: "Backend",
        desc: "Async Python backend handling concurrent requests at blazing speed — zero blocking, maximum throughput.",
    },
    {
        num: "02",
        title: "Vector Memory Store",
        subtitle: "Database",
        desc: "Semantic search database for deep contextual retrieval across all your local files and documents.",
    },
    {
        num: "03",
        title: "Local Language Model",
        subtitle: "Inference",
        desc: "On-device inference — your prompts never leave the machine. Complete privacy by default.",
    },
    {
        num: "04",
        title: "Neural Processing Unit",
        subtitle: "Hardware",
        desc: "Hardware-accelerated AI inference via dedicated NPU silicon — zero GPU dependency, instant response.",
    },
] as const;

/* Component for individual cards to handle their own local scroll-based parallax */
function StackCard({
    card,
    index,
    progress
}: {
    card: typeof stackCards[number];
    index: number;
    progress: MotionValue<number>
}) {
    // Each card's entrance stagger based on scroll progress
    const cardStart = index * 0.15;
    const cardEnd = cardStart + 0.5;

    // Scale down slightly as it moves left
    const scale = useTransform(progress, [cardStart, cardEnd], [0.8, 1]);
    const opacity = useTransform(progress, [cardStart - 0.1, cardStart + 0.1], [0, 1]);

    return (
        <motion.div
            style={{
                scale,
                opacity
            }}
            className="group relative flex h-[420px] w-[300px] shrink-0 flex-col justify-between overflow-hidden rounded-[2rem] border border-zinc-200/60 bg-white p-8 shadow-xl shadow-zinc-200/40 transition-shadow duration-500 hover:shadow-2xl hover:shadow-zinc-200/60 sm:h-[480px] sm:w-[360px] dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10 dark:shadow-none"
        >
            {/* Background Pattern */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:mix-blend-overlay dark:opacity-20" />

            <div className="flex items-center justify-between">
                <span className="text-6xl font-black text-zinc-100 transition-colors duration-500 group-hover:text-zinc-900 dark:text-white/5 dark:group-hover:text-white/20">
                    {card.num}
                </span>
                <span className="rounded-full border border-zinc-200/80 bg-zinc-50/50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 transition-all duration-300 group-hover:border-zinc-300 group-hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:group-hover:border-white/20 dark:group-hover:bg-white/10">
                    {card.subtitle}
                </span>
            </div>

            <motion.div>
                <div className="mb-6 h-px w-full bg-zinc-100 transition-all duration-500 group-hover:bg-zinc-300 dark:bg-white/10 dark:group-hover:bg-white/20" />
                <h3 className="text-2xl font-bold leading-snug text-zinc-900 dark:text-zinc-100">
                    {card.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {card.desc}
                </p>
            </motion.div>
        </motion.div>
    );
}

export default function TechStackSection() {
    const targetRef = useRef<HTMLDivElement>(null);

    // Track scroll directly without offset so calculation area is smaller
    const { scrollYProgress } = useScroll({
        target: targetRef,
    });

    // Move the entire track left as we scroll down
    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);

    return (
        <section ref={targetRef} id="stack" className="relative h-[250vh] bg-zinc-50 dark:bg-zinc-950/50">
            <div className="sticky top-0 flex h-screen items-center overflow-hidden">

                {/* Header Area */}
                <div className="absolute left-6 top-32 z-20 md:left-12 lg:top-40">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-400">
                        Infrastructure
                    </p>
                    <h2 className="mt-1 text-5xl font-black tracking-tight text-zinc-950 sm:text-7xl dark:text-zinc-50">
                        stack.
                    </h2>
                </div>

                {/* Track of cards - will-change added for extreme performance optimization */}
                <motion.div
                    style={{ x }}
                    className="flex items-center gap-12 px-6 pl-[40vw] md:px-12 md:pl-[50vw] will-change-transform"
                >
                    {stackCards.map((card, index) => (
                        <StackCard
                            key={card.num}
                            card={card}
                            index={index}
                            progress={scrollYProgress}
                        />
                    ))}
                </motion.div>

                {/* Bottom line */}
                <div className="absolute bottom-12 left-6 right-6 md:left-12 md:right-12">
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                        <p className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                            Fully local · Zero cloud · Your hardware
                        </p>
                        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                </div>

            </div>
        </section>
    );
}
