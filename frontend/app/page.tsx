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
  GitPullRequest,
  BookOpen,
  LayoutGrid,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { checkHealth } from "@/lib/api";
import dynamic from "next/dynamic";
import { LazySection } from "@/components/ui/LazySection";

const InteractiveFooter = dynamic(
  () => import("@/components/Footer/InteractiveFooter"),
  { ssr: false }
);

const ComparisonSection = dynamic(
  () => import("@/components/Landing/ComparisonSection"),
  { ssr: false }
);
const TechStackSection = dynamic(
  () => import("@/components/Landing/TechStackSection"),
  { ssr: false }
);
const SmoothScroll = dynamic(
  () => import("@/components/SmoothScroll"),
  { ssr: false }
);
const HeroIllustration = dynamic(
  () => import("@/components/Landing/HeroIllustration"),
  { ssr: false }
);

/* ──────────────────── Section divider ──────────────────── */
function SectionDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div
      className={`pointer-events-none relative h-24 w-full ${flip ? "rotate-180" : ""
        }`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-100/80" />
      <div className="absolute bottom-0 h-px w-full bg-gradient-to-r from-transparent via-zinc-300/50 to-transparent" />
    </div>
  );
}

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
      <SmoothScroll />

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
          <a href="#comparison" className="transition hover:text-foreground">
            Comparison
          </a>
          <a href="#architecture" className="transition hover:text-foreground">
            Architecture
          </a>
          <a href="#integrations" className="transition hover:text-foreground">
            Integrations
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
      <section className="relative flex min-h-screen flex-col overflow-hidden px-6 pt-40 pb-24">
        {/* Neural network canvas — absolute background */}
        <HeroIllustration />

        {/* Noise / grain texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />

        {/* ── Hero text — centred above canvas ── */}
        <FadeIn className="relative z-10 flex w-full flex-col items-center text-center">
          <Badge
            variant="secondary"
            className="mb-6 gap-1.5 rounded-full border border-zinc-200 bg-white/80 px-4 py-1.5 text-xs font-semibold text-zinc-700 backdrop-blur-sm"
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
                className="rounded-full border-zinc-300 bg-white/70 px-8 text-base font-medium backdrop-blur-sm"
              >
                <Github className="mr-2 h-4 w-4" />
                View Source
              </Button>
            </a>
          </div>
        </FadeIn>

        {/* ── "Built On" logo bar — pushed to bottom ── */}
        <div className="relative z-10 mt-auto flex flex-col items-center gap-3 pt-16">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400">
            Built on
          </p>
          <div className="flex flex-wrap items-center justify-center">
            {["AMD Ryzen AI", "Ollama", "ChromaDB", "FastAPI", "Next.js"].map(
              (name, i, arr) => (
                <span key={name} className="flex items-center">
                  <span className="px-5 text-sm font-semibold tracking-wide text-zinc-500">
                    {name}
                  </span>
                  {i < arr.length - 1 && (
                    <span className="h-3 w-px bg-zinc-300" />
                  )}
                </span>
              )
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        >
          <ChevronDown className="h-5 w-5 text-zinc-400/60" />
        </motion.div>
      </section>

      {/* ─── Transition: Hero → Features ─── */}
      <SectionDivider />

      {/* ─── The Three Pillars ─── */}
      <LazySection>
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
                glowColor: "from-emerald-500/20 to-teal-400/20",
                iconColor: "text-emerald-600",
              },
              {
                icon: Mic,
                title: "The Voice",
                subtitle: "RAG Chat Engine",
                description:
                  "Ask anything. Synapse searches your memory bank, retrieves the most relevant chunks, and generates grounded answers via local Ollama LLM.",
                badge: "Query → LLM + Sources",
                glowColor: "from-purple-500/20 to-violet-400/20",
                iconColor: "text-purple-600",
              },
              {
                icon: Hand,
                title: "The Hands",
                subtitle: "OS Orchestrator",
                description:
                  "Switch between Focus, Meeting, and Research modes. Synapse rearranges your workspace — silencing notifications or opening tools automatically.",
                badge: "Mode → OS Control",
                glowColor: "from-blue-500/20 to-indigo-400/20",
                iconColor: "text-blue-600",
              },
            ].map((pillar, i) => (
              <FadeIn key={pillar.title} delay={i * 0.12}>
                <Card className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-zinc-200/60 bg-white p-8 transition-all duration-500 hover:-translate-y-2 hover:border-zinc-300 hover:shadow-2xl hover:shadow-zinc-200/50">
                  {/* Number Watermark */}
                  <div className="pointer-events-none absolute -bottom-6 -right-4 z-0 text-9xl font-black text-zinc-50/80 transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-110">
                    0{i + 1}
                  </div>

                  {/* Glow & Pattern Background */}
                  <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${pillar.glowColor} opacity-0 blur-[40px] transition-all duration-700 group-hover:scale-150 group-hover:opacity-100`} />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative z-10 flex h-full flex-col">
                    {/* Icon */}
                    <div className={`mb-6 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 shadow-sm transition-transform duration-500 group-hover:scale-110 ${pillar.iconColor}`}>
                      <pillar.icon className="h-5 w-5" />
                    </div>

                    {/* Header */}
                    <h3 className="text-xl font-bold tracking-tight text-zinc-900">{pillar.title}</h3>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="h-px w-4 bg-zinc-300 transition-all duration-500 group-hover:w-8 group-hover:bg-zinc-400" />
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        {pillar.subtitle}
                      </p>
                    </div>

                    {/* Body */}
                    <p className="mt-6 flex-grow text-sm leading-relaxed text-zinc-600">
                      {pillar.description}
                    </p>

                    {/* Footer / Badge */}
                    <div className="mt-8 pt-4">
                      <Badge
                        variant="secondary"
                        className="rounded-full border border-zinc-200/80 bg-zinc-50/50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 backdrop-blur-sm transition-all duration-300 group-hover:border-zinc-300 group-hover:bg-white"
                      >
                        {pillar.badge}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </FadeIn>
            ))}
          </div>
        </section>
      </LazySection>

      {/* ─── Transition: Features → Comparison ─── */}
      <SectionDivider />

      {/* ─── Problem vs. Solution Comparison ─── */}
      <LazySection height="800px">
        <ComparisonSection />
      </LazySection>

      {/* ─── Transition: Comparison → Architecture ─── */}
      <SectionDivider />

      {/* ─── Architecture ─── */}
      <LazySection>
        <section
          id="architecture"
          className="bg-zinc-50 py-32"
        >
          <div className="mx-auto max-w-5xl px-6 md:px-12">
            <FadeIn className="flex flex-col items-center text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Under the Hood
              </p>
              <h2 className="mt-3 max-w-md text-3xl font-bold tracking-tight sm:text-4xl">
                Hardware-aware pipeline
              </h2>
              <p className="mt-4 max-w-lg text-zinc-600">
                Every query flows through a neural routing layer that assigns work
                to the optimal processor — NPU for embeddings, GPU for inference,
                CPU as fallback.
              </p>
            </FadeIn>

            {/* Pipeline cards — 2 column */}
            <div className="mt-14 grid gap-5 sm:grid-cols-2">
              {[
                {
                  icon: Upload,
                  name: "Document Ingestion",
                  desc: "Upload PDFs, text files, and code. Documents are chunked, cleaned, and queued for embedding.",
                  tag: "Input Layer",
                },
                {
                  icon: Cpu,
                  name: "NPU Embedding",
                  desc: "Ryzen AI NPU accelerates vector embedding generation — faster and more power-efficient than CPU fallback.",
                  tag: "AMD Ryzen AI",
                },
                {
                  icon: Brain,
                  name: "Vector Storage",
                  desc: "Embeddings are indexed in a local ChromaDB instance. Semantic search runs entirely on your machine.",
                  tag: "ChromaDB",
                },
                {
                  icon: MessageSquare,
                  name: "LLM Inference",
                  desc: "Queries are answered by a local Llama 3 model via Ollama, grounded with retrieved context chunks.",
                  tag: "Ollama",
                },
              ].map((step, i) => (
                <FadeIn key={step.name} delay={i * 0.08}>
                  <Card className="group rounded-2xl border-white/80 bg-white/60 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:bg-white/80 hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-zinc-600 ring-1 ring-black/[0.04]">
                        <step.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">{step.name}</h3>
                          <Badge
                            variant="secondary"
                            className="border border-white/60 bg-white/50 text-[10px] font-semibold text-zinc-500 backdrop-blur-sm"
                          >
                            {step.tag}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </Card>
                </FadeIn>
              ))}
            </div>

            {/* Flow summary */}
            <FadeIn delay={0.35} className="mt-10 flex justify-center">
              <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-5 py-2.5 shadow-sm backdrop-blur-xl">
                {["Ingest", "Embed", "Store", "Query"].map((s, i, arr) => (
                  <span key={s} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-600">{s}</span>
                    {i < arr.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-zinc-300" />
                    )}
                  </span>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>
      </LazySection>

      {/* ─── Transition: Architecture → Stack ─── */}
      <SectionDivider />

      {/* ─── Tech Stack — Editorial Layout ─── */}
      <LazySection height="1000px">
        <TechStackSection />
      </LazySection>

      {/* ─── Transition: Stack → Integrations ─── */}
      <SectionDivider />

      {/* ─── Integrations ─── */}
      <LazySection>
        <section
          id="integrations"
          className="bg-zinc-50/50 py-32"
        >
          <div className="mx-auto max-w-5xl px-6 md:px-12">
            {/* Header */}
            <FadeIn className="flex flex-col items-center text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Integrations
              </p>
              <h2 className="mt-3 max-w-md text-3xl font-bold tracking-tight sm:text-4xl">
                Pull your world into Synapse
              </h2>
              <p className="mt-4 max-w-lg text-zinc-600">
                Connect your platforms and let Synapse ingest PRs, messages,
                docs, and tickets into local ChromaDB — zero cloud leakage.
              </p>
            </FadeIn>

            {/* Cards — 2×2 */}
            <div className="mt-14 grid gap-5 sm:grid-cols-2">
              {[
                {
                  icon: GitPullRequest,
                  name: "GitHub",
                  desc: "Sync repositories, pull requests, issues, and code reviews into local memory.",
                  tag: "Code & Reviews",
                },
                {
                  icon: MessageSquare,
                  name: "Slack",
                  desc: "Pull saved messages, channel threads, and team conversations for contextual answers.",
                  tag: "Messages & Threads",
                },
                {
                  icon: BookOpen,
                  name: "Notion",
                  desc: "Ingest workspace docs, databases, meeting notes, and wikis for deep RAG queries.",
                  tag: "Docs & Databases",
                },
                {
                  icon: LayoutGrid,
                  name: "Jira",
                  desc: "Sync active sprint tickets, epics, stories, and bug reports into your knowledge base.",
                  tag: "Sprints & Tickets",
                },
              ].map((int, i) => (
                <FadeIn key={int.name} delay={i * 0.08}>
                  <Card className="group rounded-2xl border-white/80 bg-white/60 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:bg-white/80 hover:shadow-md">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-zinc-600 ring-1 ring-black/[0.04]">
                        <int.icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">{int.name}</h3>
                          <Badge
                            variant="secondary"
                            className="border border-white/60 bg-white/50 text-[10px] font-semibold text-zinc-500 backdrop-blur-sm"
                          >
                            {int.tag}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {int.desc}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                            Ready to connect
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </FadeIn>
              ))}
            </div>

            {/* CTA */}
            <FadeIn delay={0.35} className="mt-12 flex flex-col items-center text-center">
              <Link href="/settings/integrations">
                <Button
                  size="lg"
                  className="rounded-full bg-foreground px-8 text-base font-medium text-white hover:bg-foreground/90"
                >
                  <Plug className="mr-2 h-4 w-4" />
                  Connect Your Tools
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-zinc-400">
                <Shield className="h-3.5 w-3.5" />
                API keys stay on your machine. Data is pulled, never pushed.
              </p>
            </FadeIn>
          </div>
        </section>
      </LazySection>

      {/* ─── Transition: Integrations → Footer ─── */}
      <SectionDivider />

      {/* ─── Interactive Footer ─── */}
      <LazySection height="400px">
        <InteractiveFooter />
      </LazySection>

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
