"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

/**
 * Initialises Lenis smooth scroll on mount, tears it down on unmount.
 * Renders nothing — just drop <SmoothScroll /> once near the app root.
 */
export default function SmoothScroll() {
    const lenisRef = useRef<Lenis | null>(null);
    const rafHandleRef = useRef<number | null>(null);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,          // scroll interpolation speed (lower = snappier)
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // ease-out expo
            touchMultiplier: 1.5,   // mobile scroll speed multiplier
            infinite: false,
        });

        lenisRef.current = lenis;

        function raf(time: number) {
            lenis.raf(time);
            rafHandleRef.current = requestAnimationFrame(raf);
        }
        rafHandleRef.current = requestAnimationFrame(raf);

        return () => {
            if (rafHandleRef.current) {
                cancelAnimationFrame(rafHandleRef.current);
            }
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    return null;
}
