"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Eye, EyeOff, CheckCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ConnectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    platformName: string;
    platformIcon: React.ReactNode;
    onSubmit: (key: string) => void;
}

export default function ConnectModal({
    open,
    onOpenChange,
    platformName,
    platformIcon,
    onSubmit,
}: ConnectModalProps) {
    const [key, setKey] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!key.trim()) return;

        setIsSubmitting(true);

        // Simulate API call
        await new Promise((r) => setTimeout(r, 1200));

        onSubmit(key);
        setIsSubmitting(false);
        setSuccess(true);

        toast.success(`${platformName} Connected Successfully`, {
            description: "API key saved. You can now sync data.",
        });

        // Close after a brief delay to show success state
        setTimeout(() => {
            onOpenChange(false);
            setKey("");
            setSuccess(false);
            setShowKey(false);
        }, 800);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-2xl border-zinc-200 bg-white p-0 shadow-xl sm:max-w-md">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                            {platformIcon}
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold">
                                Connect {platformName}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500">
                                Enter your Personal Access Token to connect
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6">
                    <div className="space-y-2">
                        <Label
                            htmlFor="api-key"
                            className="text-sm font-medium text-zinc-700"
                        >
                            API Key / Token
                        </Label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                            <Input
                                id="api-key"
                                type={showKey ? "text" : "password"}
                                placeholder={`Paste your ${platformName} token...`}
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                disabled={isSubmitting || success}
                                className="h-11 rounded-lg border-zinc-200 bg-white pl-10 pr-10 text-sm placeholder:text-zinc-400 focus-visible:ring-foreground"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-600"
                            >
                                {showKey ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                            Your key is stored locally and never leaves your machine.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        disabled={!key.trim() || isSubmitting || success}
                        className="mt-5 h-11 w-full rounded-lg bg-foreground text-sm font-medium text-white hover:bg-foreground/90"
                    >
                        {success ? (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-2"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Connected!
                            </motion.span>
                        ) : isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Connecting...
                            </span>
                        ) : (
                            "Save & Connect"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
