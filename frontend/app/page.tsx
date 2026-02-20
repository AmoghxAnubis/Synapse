"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import {
  Brain,
  Cpu,
  Upload,
  MessageSquare,
  Shield,
  Zap,
  ArrowRight,
  ChevronDown,
  Eye,
  Hand,
  Mic,
  Github,
  Terminal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { checkHealth } from "@/lib/api";

/* ──────────────────── Fade-in wrapper ──────────────────── */
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [backendOnline, setBackendOnline] = useState(false);
  const { scrollYProgress } = useScroll();
  const headerBg = useTransform(
    scrollYProgress,
    [0, 0.05],
    ["rgba(255,255,255,0)", "rgba(255,255,255,0.85)"]
  );
  const headerBorder = useTransform(
    scrollYProgress,
    [0, 0.05],
    ["rgba(0,0,0,0)", "rgba(0,0,0,0.06)"]
  );

  useEffect(() => {
    checkHealth()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* ─── Navbar ─── */}
      <motion.nav
        style={{
          backgroundColor: headerBg,
          borderBottomColor: headerBorder,
          borderBottomWidth: 1,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 md:px-12"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Synapse</span>
        </div>

        <div className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex">
          <a href="#features" className="transition hover:text-foreground">
            Features
          </a>
          <a href="#architecture" className="transition hover:text-foreground">
            Architecture
          </a>
          <a href="#stack" className="transition hover:text-foreground">
            Stack
          </a>
        </div>

        <div className="flex items-center gap-3">
          {backendOnline && (
            <Badge
              variant="secondary"
              className="hidden gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 sm:flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Backend Online
            </Badge>
          )}
          <Link href="/auth">
            <Button
              variant="ghost"
              className="hidden rounded-full px-4 text-sm font-medium text-zinc-600 hover:text-foreground sm:inline-flex"
            >
              Log In
            </Button>
          </Link>
          <Link href="/auth">
            <Button className="rounded-full bg-foreground px-5 text-sm font-medium text-white hover:bg-foreground/90">
              Get Started
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </motion.nav>

      {/* ─── Hero ─── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20">
        {/* Subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Gradient orbs */}
        <div className="pointer-events-none absolute top-20 -left-32 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 -right-32 h-[400px] w-[400px] rounded-full bg-purple-100/30 blur-3xl" />

        <FadeIn className="relative z-10 flex flex-col items-center text-center">
          <Badge
            variant="secondary"
            className="mb-6 gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-700"
          >
            <Sparkles className="h-3 w-3" />
            Local-First · Privacy-Centric · AMD Ryzen AI
          </Badge>

          <h1 className="max-w-3xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Your personal
            <br />
            <span className="text-gradient">AI operating system</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600">
            Synapse gives you a private, local AI assistant that sees your files,
            speaks with intelligence, and acts on your OS — all powered by
            hardware-accelerated inference.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="rounded-full bg-foreground px-8 text-base font-medium text-white hover:bg-foreground/90"
              >
                Launch Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a
              href="https://github.com/AmoghxAnubis/Synapse"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-black/10 px-8 text-base font-medium"
              >
                <Github className="mr-2 h-4 w-4" />
                View Source
              </Button>
            </a>
          </div>
        </FadeIn>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 z-10"
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground/40" />
        </motion.div>
      </section>

      {/* ─── The Three Pillars ─── */}
      <section
        id="features"
        className="mx-auto max-w-6xl px-6 py-32 md:px-12"
      >
        <FadeIn>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Core Systems
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Three pillars of Synapse
          </h2>
        </FadeIn>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Eye,
              title: "The Eyes",
              subtitle: "Memory Ingestion",
              description:
                "Drag-and-drop any PDF, text, or document. Synapse chunks it, embeds it via AMD Ryzen AI NPU, and stores it in local vector memory.",
              badge: "Upload → ChromaDB",
              gradient: "from-emerald-500/10 to-teal-500/5",
              iconColor: "text-emerald-600",
            },
            {
              icon: Mic,
              title: "The Voice",
              subtitle: "RAG Chat Engine",
              description:
                "Ask anything. Synapse searches your memory bank, retrieves the most relevant chunks, and generates grounded answers via local Ollama LLM.",
              badge: "Query → LLM + Sources",
              gradient: "from-purple-500/10 to-violet-500/5",
              iconColor: "text-purple-600",
            },
            {
              icon: Hand,
              title: "The Hands",
              subtitle: "OS Orchestrator",
              description:
                "Switch between Focus, Meeting, and Research modes. Synapse rearranges your workspace — silencing notifications or opening tools automatically.",
              badge: "Mode → OS Control",
              gradient: "from-blue-500/10 to-indigo-500/5",
              iconColor: "text-blue-600",
            },
          ].map((pillar, i) => (
            <FadeIn key={pillar.title} delay={i * 0.12}>
              <Card
                className={`group relative overflow-hidden rounded-2xl border-zinc-200 bg-gradient-to-br ${pillar.gradient} p-8 transition-all duration-300 hover:border-zinc-300 hover:shadow-lg`}
              >
                <div
                  className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/[0.04] ${pillar.iconColor}`}
                >
                  <pillar.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{pillar.title}</h3>
                <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                  {pillar.subtitle}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
                <Badge
                  variant="secondary"
                  className="mt-5 rounded-full border border-zinc-200 bg-white text-[10px] font-semibold uppercase tracking-wider text-zinc-600 shadow-sm"
                >
                  {pillar.badge}
                </Badge>
              </Card>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ─── Architecture Diagram ─── */}
      <section
        id="architecture"
        className="border-y border-zinc-200 bg-zinc-50 py-32"
      >
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Under the Hood
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Hardware-aware pipeline
            </h2>
            <p className="mt-4 max-w-2xl text-zinc-600">
              Every query flows through a neural routing layer that assigns work
              to the optimal processor — NPU for embeddings, GPU for inference,
              CPU as fallback.
            </p>
          </FadeIn>

          <FadeIn delay={0.15} className="mt-16">
            <div className="relative rounded-2xl border border-zinc-200 bg-white p-8 shadow-md">
              {/* Flow diagram */}
              <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
                {[
                  {
                    icon: Upload,
                    label: "Document",
                    sub: "PDF / TXT",
                    color: "bg-emerald-50 text-emerald-600 ring-emerald-100",
                  },
                  {
                    icon: Cpu,
                    label: "NPU Embed",
                    sub: "Ryzen AI",
                    color: "bg-emerald-50 text-emerald-600 ring-emerald-100",
                  },
                  {
                    icon: Brain,
                    label: "Vector DB",
                    sub: "ChromaDB",
                    color: "bg-purple-50 text-purple-600 ring-purple-100",
                  },
                  {
                    icon: MessageSquare,
                    label: "LLM",
                    sub: "Ollama / Llama 3",
                    color: "bg-blue-50 text-blue-600 ring-blue-100",
                  },
                  {
                    icon: Zap,
                    label: "Response",
                    sub: "Answer + Sources",
                    color: "bg-amber-50 text-amber-600 ring-amber-100",
                  },
                ].map((step, i, arr) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${step.color}`}
                      >
                        <step.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{step.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {step.sub}
                        </p>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <ArrowRight className="hidden h-4 w-4 text-muted-foreground/30 md:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Tech Stack ─── */}
      <section id="stack" className="mx-auto max-w-5xl px-6 py-32 md:px-12">
        <FadeIn>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Built With
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            The tech stack
          </h2>
        </FadeIn>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { name: "Next.js", desc: "React Framework", icon: "▲" },
            { name: "FastAPI", desc: "Python Backend", icon: "⚡" },
            { name: "ChromaDB", desc: "Vector Database", icon: "🧠" },
            { name: "Ollama", desc: "Local LLM", icon: "🦙" },
            { name: "Tailwind CSS", desc: "Styling", icon: "🎨" },
            { name: "Framer Motion", desc: "Animations", icon: "✨" },
            { name: "AMD Ryzen AI", desc: "NPU Acceleration", icon: "🔴" },
            { name: "shadcn/ui", desc: "Components", icon: "🧩" },
          ].map((tech, i) => (
            <FadeIn key={tech.name} delay={i * 0.05}>
              <div
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 shadow-sm"
              >
                <span className="text-xl">{tech.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{tech.name}</p>
                  <p className="text-xs text-muted-foreground">{tech.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t border-zinc-200 bg-zinc-50/60 py-24">
        <FadeIn className="flex flex-col items-center text-center px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground shadow-lg">
            <Terminal className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to launch?
          </h2>
          <p className="mt-3 max-w-md text-muted-foreground">
            Start the backend, open the dashboard, and let Synapse take the
            wheel.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="rounded-full bg-foreground px-8 text-base font-medium text-white hover:bg-foreground/90"
              >
                Open Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 rounded-xl border border-zinc-200 bg-white px-5 py-3 font-mono text-sm text-zinc-600 shadow-sm">
            <span className="text-foreground">$</span> cd backend && python -m
            uvicorn app.main:app --reload
          </div>
        </FadeIn>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-zinc-200 px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
              <Brain className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold">Synapse</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/AmoghxAnubis/Synapse"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition hover:text-foreground"
            >
              <Github className="h-4 w-4" />
            </a>
            <span className="text-xs text-muted-foreground">
              Built with AMD Ryzen AI
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
