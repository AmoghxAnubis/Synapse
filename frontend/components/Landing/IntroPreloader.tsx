"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BOOT_HOOKS = [
    "Bypassing the cloud...",
    "Initializing local memory...",
    "Connecting hardware acceleration...",
    "Securing private context...",
    "Synapse Core Online.",
];

export default function IntroPreloader() {
    const [index, setIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Handle the sequence of text hooks
    useEffect(() => {
        // Prevent body scroll while preloader is active
        document.body.style.overflow = "hidden";

        const interval = setInterval(() => {
            setIndex((prev) => {
                if (prev >= BOOT_HOOKS.length - 1) {
                    clearInterval(interval);
                    // Wait slightly longer on the final "Online" message
                    setTimeout(() => {
                        setIsLoading(false);
                    }, 1000);
                    return prev;
                }
                return prev + 1;
            });
        }, 800);

        return () => {
            clearInterval(interval);
            // Restore scroll if component unmounts unexpectedly
            document.body.style.overflow = "";
        };
    }, []);

    // Removed immediate scroll restore to prevent layout shift during exit animation.
    // Scroll restore will happen in AnimatePresence onExitComplete instead.

    return (
        <AnimatePresence onExitComplete={() => {
            // Restore scroll only AFTER the exit animation finishes
            document.body.style.overflow = "";
        }}>
            {isLoading && (
                <motion.div
                    // The main overlay background
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-[#09090B] text-zinc-100"

                    // Exit animation: Elegant slide UP + slight fade
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{
                        duration: 1,
                        ease: [0.22, 1, 0.36, 1], // custom easeOutQuint for smoother decel
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.h1
                            key={index}
                            className="absolute text-2xl md:text-5xl font-medium tracking-tighter"

                            // Sleek micro-bounce for text enter/exit
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {BOOT_HOOKS[index]}
                        </motion.h1>
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
