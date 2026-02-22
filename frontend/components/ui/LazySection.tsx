"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

interface LazySectionProps {
    children: React.ReactNode;
    /**
     * Approximate height of the section to prevent layout jumps before it loads.
     * Defaults to "100vh" for full page sections.
     */
    height?: string;
    className?: string;
    /**
     * Root margin for the IntersectionObserver. 
     * A larger margin (e.g. "600px") ensures it loads before coming into view.
     */
    rootMargin?: string;
}

export function LazySection({
    children,
    height = "100vh",
    className = "",
    rootMargin = "600px",
}: LazySectionProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [hasIntersected, setHasIntersected] = useState(false);

    useEffect(() => {
        if (!ref.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHasIntersected(true);
                    observer.disconnect();
                }
            },
            { rootMargin }
        );

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [rootMargin]);

    return (
        <div
            ref={ref}
            style={{ minHeight: hasIntersected ? "auto" : height }}
            className={className}
        >
            {hasIntersected ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    {children}
                </motion.div>
            ) : null}
        </div>
    );
}
