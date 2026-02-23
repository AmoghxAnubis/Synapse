"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import {
  Brain,
  Cpu,
  Upload,
  MessageSquare,
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

import { useUser } from "@clerk/nextjs";

/* ───────────────── Fade In Component ───────────────── */
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

/* ════════════════════════════════════════════════════════
   LANDING PAGE
   ════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();
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

  /* 🔐 Wait until Clerk loads */
  if (!isLoaded) return null;

  /* 🔐 If not signed in */
  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xl">
        Please sign in first.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* ─── Navbar ─── */}
      <motion.nav
        style={{
          backgroundColor: headerBg,
          borderBottomColor: headerBorder,
          borderBottomWidth: 1,
          backdropFilter: "blur(16px)",
        }}
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 md:px-12"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Synapse</span>
        </div>

        <div className="flex items-center gap-3">
          {backendOnline && (
            <Badge className="hidden sm:flex bg-emerald-100 text-emerald-700">
              Backend Online
            </Badge>
          )}
        </div>
      </motion.nav>

      {/* ─── Hero Section ─── */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
        <FadeIn>
          <Badge className="mb-6 rounded-full bg-zinc-100 text-zinc-700">
            <Sparkles className="mr-2 h-3 w-3" />
            Local-First · Privacy-Centric · AMD Ryzen AI
          </Badge>

          <h1 className="text-5xl font-bold sm:text-6xl">
            Your personal AI operating system
          </h1>

          <p className="mt-6 max-w-xl text-lg text-zinc-600">
            Synapse gives you a private AI assistant that sees your files,
            speaks intelligently, and acts on your OS.
          </p>

          <div className="mt-10 flex gap-4">
            <Link href="/dashboard">
              <Button size="lg">
                Launch Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <a
              href="https://github.com/AmoghxAnubis/Synapse"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg">
                <Github className="mr-2 h-4 w-4" />
                View Source
              </Button>
            </a>
          </div>
        </FadeIn>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        Built with AMD Ryzen AI
      </footer>
    </div>
  );
}