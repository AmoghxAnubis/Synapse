"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Brain, ArrowLeft, Eye, EyeOff, Mail, Lock, User, ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/* ─── Slide animation config ─── */
const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export default function AuthPage() {
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [direction, setDirection] = useState(1);
    const [showPassword, setShowPassword] = useState(false);

    /* form state */
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    const switchMode = (to: "login" | "signup") => {
        setDirection(to === "signup" ? 1 : -1);
        setMode(to);
        setShowPassword(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: wire to backend auth
        console.log(mode, { email, password, name });
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-white px-4">
            {/* Subtle grid bg */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)",
                    backgroundSize: "64px 64px",
                }}
            />

            {/* Gradient orbs */}
            <div className="pointer-events-none absolute top-10 -left-40 h-[500px] w-[500px] rounded-full bg-blue-50 blur-3xl" />
            <div className="pointer-events-none absolute -right-40 bottom-10 h-[400px] w-[400px] rounded-full bg-purple-50 blur-3xl" />

            {/* Back to home */}
            <Link
                href="/"
                className="group absolute left-6 top-6 z-10 flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Home
            </Link>

            {/* Auth card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md"
            >
                <Card className="overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 p-0 shadow-xl backdrop-blur-xl">
                    {/* Header */}
                    <div className="flex flex-col items-center px-8 pt-10 pb-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground shadow-lg">
                            <Brain className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="mt-4 text-xl font-bold tracking-tight">
                            {mode === "login" ? "Welcome back" : "Create your account"}
                        </h1>
                        <p className="mt-1.5 text-sm text-zinc-500">
                            {mode === "login"
                                ? "Sign in to access your Synapse dashboard"
                                : "Get started with your AI operating system"}
                        </p>
                    </div>

                    {/* Tab switcher */}
                    <div className="mx-8 flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                        {(["login", "signup"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => switchMode(tab)}
                                className={`relative flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${mode === tab
                                        ? "bg-white text-foreground shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-700"
                                    }`}
                            >
                                {tab === "login" ? "Log In" : "Sign Up"}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <div className="px-8 pt-6 pb-8">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.form
                                key={mode}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                onSubmit={handleSubmit}
                                className="space-y-4"
                            >
                                {/* Name field — signup only */}
                                {mode === "signup" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-medium text-zinc-700">
                                            Full Name
                                        </Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                            <Input
                                                id="name"
                                                type="text"
                                                placeholder="John Doe"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="h-11 rounded-lg border-zinc-200 bg-white pl-10 text-sm placeholder:text-zinc-400 focus-visible:ring-foreground"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-zinc-700">
                                        Email
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="h-11 rounded-lg border-zinc-200 bg-white pl-10 text-sm placeholder:text-zinc-400 focus-visible:ring-foreground"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-sm font-medium text-zinc-700">
                                            Password
                                        </Label>
                                        {mode === "login" && (
                                            <button
                                                type="button"
                                                className="text-xs font-medium text-zinc-500 transition hover:text-foreground"
                                            >
                                                Forgot password?
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-11 rounded-lg border-zinc-200 bg-white pl-10 pr-10 text-sm placeholder:text-zinc-400 focus-visible:ring-foreground"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-600"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit */}
                                <Button
                                    type="submit"
                                    className="h-11 w-full rounded-lg bg-foreground text-sm font-medium text-white hover:bg-foreground/90"
                                >
                                    {mode === "login" ? "Sign In" : "Create Account"}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>

                                {/* Divider */}
                                <div className="relative flex items-center gap-3 py-2">
                                    <Separator className="flex-1" />
                                    <span className="text-xs text-zinc-400">or continue with</span>
                                    <Separator className="flex-1" />
                                </div>

                                {/* Social login */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11 rounded-lg border-zinc-200 text-sm font-medium hover:bg-zinc-50"
                                    >
                                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                        Google
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11 rounded-lg border-zinc-200 text-sm font-medium hover:bg-zinc-50"
                                    >
                                        <Github className="mr-2 h-4 w-4" />
                                        GitHub
                                    </Button>
                                </div>
                            </motion.form>
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-zinc-100 bg-zinc-50/50 px-8 py-4 text-center text-xs text-zinc-500">
                        {mode === "login" ? (
                            <>
                                Don&apos;t have an account?{" "}
                                <button
                                    onClick={() => switchMode("signup")}
                                    className="font-semibold text-foreground transition hover:underline"
                                >
                                    Sign up
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{" "}
                                <button
                                    onClick={() => switchMode("login")}
                                    className="font-semibold text-foreground transition hover:underline"
                                >
                                    Log in
                                </button>
                            </>
                        )}
                    </div>
                </Card>

                {/* Privacy note */}
                <p className="mt-6 text-center text-xs text-zinc-400">
                    Your data stays on your machine. Synapse is 100% local-first.
                </p>
            </motion.div>
        </div>
    );
}
