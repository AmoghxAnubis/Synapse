"use client";

import { useEffect, useRef, useCallback } from "react";

const DOT_SIZE = 10;
const CROSSHAIR_LENGTH = 28;
const CROSSHAIR_THICKNESS = 1;

export default function CustomCursor() {
    const containerRef = useRef<HTMLDivElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);
    const leftLineRef = useRef<HTMLDivElement>(null);
    const rightLineRef = useRef<HTMLDivElement>(null);
    const topLineRef = useRef<HTMLDivElement>(null);
    const bottomLineRef = useRef<HTMLDivElement>(null);

    const mouseX = useRef(-100);
    const mouseY = useRef(-100);
    const prevX = useRef(-100);
    const prevY = useRef(-100);
    const isHovering = useRef(false);
    const raf = useRef<number>(0);

    const animate = useCallback(() => {
        // Speed from frame delta (for crosshair stretch only)
        const dx = mouseX.current - prevX.current;
        const dy = mouseY.current - prevY.current;
        const speed = Math.sqrt(dx * dx + dy * dy);

        prevX.current = mouseX.current;
        prevY.current = mouseY.current;

        const dynamicLength = Math.min(
            CROSSHAIR_LENGTH + speed * 1.2,
            CROSSHAIR_LENGTH * 2.2
        );
        const scale = dynamicLength / CROSSHAIR_LENGTH;

        if (containerRef.current) {
            // Direct position — zero lag
            containerRef.current.style.transform = `translate3d(${mouseX.current}px, ${mouseY.current}px, 0)`;
        }

        // Stretch crosshairs using scale transform to avoid layout thrashing
        if (leftLineRef.current) leftLineRef.current.style.transform = `scaleX(${scale})`;
        if (rightLineRef.current) rightLineRef.current.style.transform = `scaleX(${scale})`;
        if (topLineRef.current) topLineRef.current.style.transform = `scaleY(${scale})`;
        if (bottomLineRef.current) bottomLineRef.current.style.transform = `scaleY(${scale})`;

        // Scale dot on hover
        if (dotRef.current) {
            dotRef.current.style.transform = `scale(${isHovering.current ? 1.6 : 1})`;
        }

        raf.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            mouseX.current = e.clientX;
            mouseY.current = e.clientY;
        };

        const onEnter = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === "A" ||
                target.tagName === "BUTTON" ||
                target.closest("a") ||
                target.closest("button") ||
                target.closest("[role='button']")
            ) {
                isHovering.current = true;
            }
        };

        const onLeave = () => {
            isHovering.current = false;
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseover", onEnter);
        document.addEventListener("mouseout", onLeave);
        raf.current = requestAnimationFrame(animate);

        return () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseover", onEnter);
            document.removeEventListener("mouseout", onLeave);
            cancelAnimationFrame(raf.current);
        };
    }, [animate]);

    return (
        <div
            ref={containerRef}
            className="pointer-events-none fixed left-0 top-0 z-[9999]"
            style={{ willChange: "transform" }}
        >
            {/* Center dot */}
            <div
                ref={dotRef}
                className="absolute rounded-full bg-zinc-600 shadow-[0_0_6px_rgba(113,113,122,0.4)]"
                style={{
                    width: DOT_SIZE,
                    height: DOT_SIZE,
                    top: -DOT_SIZE / 2,
                    left: -DOT_SIZE / 2,
                    transition: "transform 0.15s ease",
                    willChange: "transform",
                }}
            />

            {/* Left line */}
            <div
                ref={leftLineRef}
                className="absolute bg-zinc-300"
                style={{
                    width: CROSSHAIR_LENGTH,
                    height: CROSSHAIR_THICKNESS,
                    top: -CROSSHAIR_THICKNESS / 2,
                    right: DOT_SIZE / 2 + 4,
                    opacity: 0.6,
                    transformOrigin: "right center",
                    transition: "transform 0.08s ease-out",
                    willChange: "transform",
                }}
            />

            {/* Right line */}
            <div
                ref={rightLineRef}
                className="absolute bg-zinc-300"
                style={{
                    width: CROSSHAIR_LENGTH,
                    height: CROSSHAIR_THICKNESS,
                    top: -CROSSHAIR_THICKNESS / 2,
                    left: DOT_SIZE / 2 + 4,
                    opacity: 0.6,
                    transformOrigin: "left center",
                    transition: "transform 0.08s ease-out",
                    willChange: "transform",
                }}
            />

            {/* Top line */}
            <div
                ref={topLineRef}
                className="absolute bg-zinc-300"
                style={{
                    width: CROSSHAIR_THICKNESS,
                    height: CROSSHAIR_LENGTH,
                    left: -CROSSHAIR_THICKNESS / 2,
                    bottom: DOT_SIZE / 2 + 4,
                    opacity: 0.6,
                    transformOrigin: "bottom center",
                    transition: "transform 0.08s ease-out",
                    willChange: "transform",
                }}
            />

            {/* Bottom line */}
            <div
                ref={bottomLineRef}
                className="absolute bg-zinc-300"
                style={{
                    width: CROSSHAIR_THICKNESS,
                    height: CROSSHAIR_LENGTH,
                    left: -CROSSHAIR_THICKNESS / 2,
                    top: DOT_SIZE / 2 + 4,
                    opacity: 0.6,
                    transformOrigin: "top center",
                    transition: "transform 0.08s ease-out",
                    willChange: "transform",
                }}
            />
        </div>
    );
}
