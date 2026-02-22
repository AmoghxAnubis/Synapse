"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const mouseX = useRef(0);
    const mouseY = useRef(0);
    const prevX = useRef(0);
    const prevY = useRef(0);
    const raf = useRef<number>(0);

    // To handle recursive requestAnimationFrame without circular dependency in useCallback
    const animate = useCallback(() => {
        // Speed from frame delta (for crosshair stretch only)
        // const dx = mouseX.current - prevX.current;
        // const dy = mouseY.current - prevY.current;
        prevX.current = mouseX.current;
        prevY.current = mouseY.current;

        if (cursorRef.current) {
            cursorRef.current.style.transform = `translate3d(${mouseX.current}px, ${mouseY.current}px, 0)`;
        }

        // We use a separate function reference or just rely on the fact that animate is stable
        // But ESLint complains about accessing 'animate' before declaration.
        // We can solve this by using a ref for the animate function itself if needed,
        // OR simply defining the function inside useEffect to avoid the circularity with useCallback entirely.
    }, []);

    useEffect(() => {
        // Define loop inside useEffect to avoid "access before declaration" issues
        const loop = () => {
            animate();
            raf.current = requestAnimationFrame(loop);
        };

        const onMove = (e: MouseEvent) => {
            mouseX.current = e.clientX;
            mouseY.current = e.clientY;
        };

        const onMouseEnter = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === "BUTTON" ||
                target.tagName === "A" ||
                target.closest("button") ||
                target.closest("a")
            ) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseover", onMouseEnter);

        // Start animation loop
        raf.current = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseover", onMouseEnter);
            cancelAnimationFrame(raf.current);
        };
    }, [animate]);

    return (
        <div
            ref={cursorRef}
            className="pointer-events-none fixed left-0 top-0 z-[9999] flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center mix-blend-difference"
        >
            <AnimatePresence>
                {isHovering ? (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 2.5, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="absolute h-full w-full rounded-full bg-white opacity-20 blur-sm"
                    />
                ) : (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="h-2 w-2 rounded-full bg-white"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
