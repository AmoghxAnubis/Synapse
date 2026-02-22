"use client";

import { useRef, useEffect } from "react";

export default function HeroIllustration() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const isVisibleRef = useRef<boolean>(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Make the canvas fill its parent container
        const setSize = () => {
            const parent = canvas.parentElement!;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = parent.offsetWidth * dpr;
            canvas.height = parent.offsetHeight * dpr;
        };
        setSize();
        window.addEventListener("resize", setSize);

        const ctx = canvas.getContext("2d")!;

        // ── helpers ──────────────────────────────────────────────
        const dpr = () => window.devicePixelRatio || 1;
        const CW = () => canvas.width / dpr();
        const CH = () => canvas.height / dpr();

        // ── particles ────────────────────────────────────────────
        const COUNT = 90;
        type P = { x: number; y: number; vx: number; vy: number; r: number };
        const pts: P[] = [];

        const initPts = () => {
            pts.length = 0;
            for (let i = 0; i < COUNT; i++) {
                pts.push({
                    x: Math.random() * CW(),
                    y: Math.random() * CH(),
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.25,
                    r: 2 + Math.random() * 3,
                });
            }
        };
        initPts();

        // Re-scatter particles on resize
        window.addEventListener("resize", initPts);

        // ── draw loop ─────────────────────────────────────────────
        const MAX_DIST = 170; // connection threshold (px)

        const draw = () => {
            if (!isVisibleRef.current) return;

            const cw = CW();
            const ch = CH();
            const d = dpr();
            ctx.setTransform(d, 0, 0, d, 0, 0);

            // Background
            const bg = ctx.createLinearGradient(0, 0, 0, ch);
            bg.addColorStop(0, "rgb(248,248,249)");
            bg.addColorStop(0.5, "rgb(236,236,240)");
            bg.addColorStop(1, "rgb(218,218,224)");
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, cw, ch);

            // Move + wrap
            for (const p of pts) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = cw;
                if (p.x > cw) p.x = 0;
                if (p.y < 0) p.y = ch;
                if (p.y > ch) p.y = 0;
            }

            // Connections
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const dx = pts[i].x - pts[j].x;
                    const dy = pts[i].y - pts[j].y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < MAX_DIST * MAX_DIST) {
                        const dist = Math.sqrt(d2);
                        const alpha = (1 - dist / MAX_DIST) * 0.45;
                        ctx.beginPath();
                        ctx.moveTo(pts[i].x, pts[i].y);
                        ctx.lineTo(pts[j].x, pts[j].y);
                        ctx.strokeStyle = `rgba(50,50,65,${alpha})`;
                        ctx.lineWidth = (1 - dist / MAX_DIST) * 1.8;
                        ctx.stroke();
                    }
                }
            }

            // Nodes
            for (const p of pts) {
                // Halo
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(80,80,100,0.1)";
                ctx.fill();
                // Core
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(40,40,55,0.75)";
                ctx.fill();
            }

            // Top fade — blends into white page above
            const topFade = ctx.createLinearGradient(0, 0, 0, ch * 0.22);
            topFade.addColorStop(0, "rgba(255,255,255,1)");
            topFade.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = topFade;
            ctx.fillRect(0, 0, cw, ch * 0.22);

            // Bottom fade — flows into next section
            const botFade = ctx.createLinearGradient(0, ch * 0.75, 0, ch);
            botFade.addColorStop(0, "rgba(255,255,255,0)");
            botFade.addColorStop(1, "rgba(255,255,255,0.9)");
            ctx.fillStyle = botFade;
            ctx.fillRect(0, 0, cw, ch);

            rafRef.current = requestAnimationFrame(draw);
        };

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                isVisibleRef.current = true;
                if (!rafRef.current) {
                    rafRef.current = requestAnimationFrame(draw);
                }
            } else {
                isVisibleRef.current = false;
                if (rafRef.current) {
                    cancelAnimationFrame(rafRef.current);
                    rafRef.current = 0;
                }
            }
        }, { threshold: 0 });

        observer.observe(canvas);

        return () => {
            observer.disconnect();
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener("resize", setSize);
            window.removeEventListener("resize", initPts);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0"
            style={{ width: "100%", height: "100%" }}
        />
    );
}
