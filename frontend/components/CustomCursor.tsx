"use client";

import { useEffect, useRef } from "react";

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

    useEffect(() => {
        let rafId: number;

        // Optimization: Track last applied styles to avoid redundant DOM writes
        let lastX = -100;
        let lastY = -100;
        let lastScale = 1;
        let lastHover = false;

        const animate = () => {
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

            // Optimization: Skip DOM updates if state hasn't changed
            // We check if position, scale, and hover state are identical to last frame
            const x = mouseX.current;
            const y = mouseY.current;
            const hover = isHovering.current;
            const scaleChanged = Math.abs(scale - lastScale) > 0.001;

            if (
                x === lastX &&
                y === lastY &&
                !scaleChanged &&
                hover === lastHover
            ) {
                rafId = requestAnimationFrame(animate);
                return;
            }

            if (containerRef.current && (x !== lastX || y !== lastY)) {
                // Direct position — zero lag
                containerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                lastX = x;
                lastY = y;
            }

            // Stretch crosshairs using scale transform to avoid layout thrashing
            if (scaleChanged) {
                const scaleStr = `scaleX(${scale})`;
                const scaleYStr = `scaleY(${scale})`;
                if (leftLineRef.current) leftLineRef.current.style.transform = scaleStr;
                if (rightLineRef.current) rightLineRef.current.style.transform = scaleStr;
                if (topLineRef.current) topLineRef.current.style.transform = scaleYStr;
                if (bottomLineRef.current) bottomLineRef.current.style.transform = scaleYStr;
                lastScale = scale;
            }

            // Scale dot on hover
            if (dotRef.current && hover !== lastHover) {
                dotRef.current.style.transform = `scale(${hover ? 1.6 : 1})`;
                lastHover = hover;
            }

            rafId = requestAnimationFrame(animate);
        };

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
        rafId = requestAnimationFrame(animate);

        return () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseover", onEnter);
            document.removeEventListener("mouseout", onLeave);
            cancelAnimationFrame(rafId);
        };
    }, []);

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
