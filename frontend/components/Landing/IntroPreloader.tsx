"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const INTRO_LINES = ["Your context.", "Your computer.", "Synapse."];

export default function IntroPreloader() {
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const previous = document.body.style.overflow;
    if (!reduced) document.body.style.overflow = "hidden";
    const advance = window.setInterval(() => setIndex((value) => Math.min(value + 1, INTRO_LINES.length - 1)), 600);
    const finish = window.setTimeout(() => setIsLoading(false), reduced ? 0 : 2000);
    const skip = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLoading(false);
    };
    window.addEventListener("keydown", skip);
    return () => {
      window.clearInterval(advance);
      window.clearTimeout(finish);
      window.removeEventListener("keydown", skip);
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!isLoading) document.body.style.overflow = "";
  }, [isLoading]);

  return <AnimatePresence>
    {isLoading && <motion.div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-[#09090B] text-zinc-100"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <AnimatePresence mode="wait">
        <motion.p key={index} className="absolute text-2xl md:text-5xl font-medium tracking-tighter"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}>
          {INTRO_LINES[index]}
        </motion.p>
      </AnimatePresence>
      <button onClick={() => setIsLoading(false)} className="absolute bottom-10 rounded-full border border-white/20 px-5 py-2 text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4">
        Skip intro
      </button>
    </motion.div>}
  </AnimatePresence>;
}
