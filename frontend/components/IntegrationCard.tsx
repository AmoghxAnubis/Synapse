"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, RefreshCw, Link2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export type IntegrationStatus = "connected" | "disconnected" | "syncing";

export interface IntegrationCardProps {
    name: string;
    description: string;
    icon: React.ReactNode;
    status: IntegrationStatus;
    lastSynced?: string;
    accentColor: string; // e.g. "emerald", "purple", "blue", "orange"
    onConnect: () => void;
    onSync: () => void;
    onToggle: (active: boolean) => void;
    isActive: boolean;
}

const accentMap: Record<string, { border: string; bg: string; text: string; dot: string; ring: string }> = {
    emerald: {
        border: "hover:border-emerald-300",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
        ring: "ring-emerald-200",
    },
    purple: {
        border: "hover:border-purple-300",
        bg: "bg-purple-50",
        text: "text-purple-700",
        dot: "bg-purple-500",
        ring: "ring-purple-200",
    },
    blue: {
        border: "hover:border-blue-300",
        bg: "bg-blue-50",
        text: "text-blue-700",
        dot: "bg-blue-500",
        ring: "ring-blue-200",
    },
    orange: {
        border: "hover:border-orange-300",
        bg: "bg-orange-50",
        text: "text-orange-700",
        dot: "bg-orange-500",
        ring: "ring-orange-200",
    },
};

export default function IntegrationCard({
    name,
    description,
    icon,
    status,
    lastSynced,
    accentColor,
    onConnect,
    onSync,
    onToggle,
    isActive,
}: IntegrationCardProps) {
    const accent = accentMap[accentColor] ?? accentMap.blue;

    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
        >
            <Card
                className={`relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 ${accent.border} hover:shadow-md`}
            >
                {/* Top row: icon + toggle */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        {/* Icon container */}
                        <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent.bg} ${accent.text} ring-1 ${accent.ring}`}
                        >
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-900">{name}</h3>
                            <div className="mt-0.5 flex items-center gap-2">
                                {/* Status badge */}
                                {status === "connected" && (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 border border-emerald-200 bg-emerald-50 px-2 py-0 text-[10px] font-semibold text-emerald-700"
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Connected
                                    </Badge>
                                )}
                                {status === "disconnected" && (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 border border-zinc-200 bg-zinc-50 px-2 py-0 text-[10px] font-semibold text-zinc-500"
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                                        Disconnected
                                    </Badge>
                                )}
                                {status === "syncing" && (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 border border-blue-200 bg-blue-50 px-2 py-0 text-[10px] font-semibold text-blue-700"
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        Syncing...
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Toggle */}
                    <Switch
                        checked={isActive}
                        onCheckedChange={onToggle}
                        className="data-[state=checked]:bg-foreground"
                    />
                </div>

                {/* Description */}
                <p className="mt-4 text-sm leading-relaxed text-zinc-500">
                    {description}
                </p>

                {/* Last synced */}
                {lastSynced && (
                    <p className="mt-2 text-[11px] text-zinc-400">
                        Last synced: {lastSynced}
                    </p>
                )}

                {/* Actions */}
                <div className="mt-5 flex items-center gap-2">
                    {status === "disconnected" ? (
                        <Button
                            onClick={onConnect}
                            className="h-9 rounded-lg bg-foreground px-4 text-xs font-medium text-white hover:bg-foreground/90"
                        >
                            <Link2 className="mr-1.5 h-3.5 w-3.5" />
                            Connect
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={onSync}
                                variant="outline"
                                disabled={status === "syncing"}
                                className="h-9 rounded-lg border-zinc-200 px-4 text-xs font-medium hover:bg-zinc-50"
                            >
                                {status === "syncing" ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                {status === "syncing" ? "Syncing..." : "Sync Now"}
                            </Button>
                            <Button
                                onClick={onConnect}
                                variant="ghost"
                                className="h-9 rounded-lg px-3 text-xs text-zinc-500 hover:text-foreground"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                        </>
                    )}
                </div>
            </Card>
        </motion.div>
    );
}
