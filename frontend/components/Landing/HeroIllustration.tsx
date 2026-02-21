"use client";

import { useRef, useEffect } from "react";

/**
 * Draws a dramatic neural-network–style illustration on a canvas.
 * Fully monochrome (white / grey / black). Renders once, no animation loop.
 */
export default function HeroIllustration() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(dpr, dpr);

        const W = rect.width;
        const H = rect.height;

        // ── Background gradient: transparent top → dark bottom ──
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, "rgba(255,255,255,0)");
        bgGrad.addColorStop(0.3, "rgba(245,245,245,0.3)");
        bgGrad.addColorStop(1, "rgba(228,228,231,0.5)");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // ── Generate nodes ──
        interface Node {
            x: number;
            y: number;
            r: number;
            opacity: number;
        }
        const nodes: Node[] = [];
        const nodeCount = Math.floor(W * H * 0.00015); // density scales with canvas size

        for (let i = 0; i < nodeCount; i++) {
            // Cluster more nodes toward the center
            const angle = Math.random() * Math.PI * 2;
            const dist =
                Math.pow(Math.random(), 0.6) * Math.min(W, H) * 0.5;
            const cx = W / 2;
            const cy = H * 0.5;
            nodes.push({
                x: cx + Math.cos(angle) * dist * (W / H) * 0.8,
                y: cy + Math.sin(angle) * dist,
                r: 1 + Math.random() * 2.5,
                opacity: 0.15 + Math.random() * 0.5,
            });
        }

        // ── Draw connections ──
        const maxDist = Math.min(W, H) * 0.18;
        ctx.lineCap = "round";

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < maxDist) {
                    const alpha = (1 - d / maxDist) * 0.12;
                    ctx.strokeStyle = `rgba(113,113,122,${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }

        // ── Draw nodes ──
        for (const node of nodes) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(82,82,91,${node.opacity})`;
            ctx.fill();
        }

        // ── Central glow (brain focal point) ──
        const glowGrad = ctx.createRadialGradient(
            W / 2, H * 0.5, 0,
            W / 2, H * 0.5, Math.min(W, H) * 0.25
        );
        glowGrad.addColorStop(0, "rgba(161,161,170,0.15)");
        glowGrad.addColorStop(0.5, "rgba(161,161,170,0.05)");
        glowGrad.addColorStop(1, "rgba(161,161,170,0)");
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, W, H);

        // ── Top edge fade (blends into the text above) ──
        const topFade = ctx.createLinearGradient(0, 0, 0, H * 0.3);
        topFade.addColorStop(0, "rgba(255,255,255,1)");
        topFade.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = topFade;
        ctx.fillRect(0, 0, W, H * 0.3);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none w-full"
            style={{ height: 320 }}
        />
    );
}
