import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import React from "react";

export type IntegrationStatus = "connected" | "disconnected" | "syncing";

interface IntegrationCardProps {
    name: string;
    description: string;
    icon: React.ReactNode;
    accentColor: string;
    status: IntegrationStatus;
    lastSynced?: string;
    isActive: boolean;
    onConnect: () => void;
    onSync: () => void;
    onToggle: (active: boolean) => void;
}

export default function IntegrationCard({
    name,
    description,
    icon,
    accentColor,
    status,
    lastSynced,
    isActive,
    onConnect,
    onSync,
    onToggle,
}: IntegrationCardProps) {
    const isConnected = status !== "disconnected";
    const isSyncing = status === "syncing";

    // Dynamic accent styles
    const accentMap: Record<string, string> = {
        purple: "bg-purple-50 text-purple-600 border-purple-200",
        blue: "bg-blue-50 text-blue-600 border-blue-200",
        orange: "bg-orange-50 text-orange-600 border-orange-200",
        zinc: "bg-zinc-50 text-zinc-600 border-zinc-200",
    };
    const accentClass = accentMap[accentColor] || accentMap.zinc;

    return (
        <Card className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/50">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex gap-4">
                    {/* Icon container */}
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${accentClass} transition-transform duration-300 group-hover:scale-105`}
                    >
                        {React.cloneElement(icon as React.ReactElement, {
                            className: "h-6 w-6",
                        })}
                    </div>

                    <div>
                        <h3 className="text-base font-bold text-zinc-900">{name}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                            {description}
                        </p>
                    </div>
                </div>

                {isConnected && (
                    <Switch
                        checked={isActive}
                        onCheckedChange={onToggle}
                        className="data-[state=checked]:bg-emerald-500"
                    />
                )}
            </div>

            {/* Footer / Actions */}
            <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                    {isConnected ? (
                        <Badge
                            variant="secondary"
                            className="w-fit gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700"
                        >
                            <span className="relative flex h-2 w-2">
                                {isSyncing && (
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                )}
                                <span className={`relative inline-flex h-2 w-2 rounded-full ${isSyncing ? "bg-emerald-500" : "bg-emerald-500"}`}></span>
                            </span>
                            {isSyncing ? "Syncing..." : "Active"}
                        </Badge>
                    ) : (
                        <Badge
                            variant="secondary"
                            className="w-fit gap-1.5 border-zinc-200 bg-zinc-50 text-zinc-500"
                        >
                            <AlertCircle className="h-3 w-3" />
                            Disconnected
                        </Badge>
                    )}

                    {lastSynced && (
                        <span className="text-[10px] font-medium text-zinc-400">
                            Synced {lastSynced}
                        </span>
                    )}
                </div>

                <div className="flex items-center">
                    {isConnected ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onSync}
                            disabled={isSyncing || !isActive}
                            className="h-8 gap-2 rounded-full px-3 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                        >
                            <RefreshCw
                                className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
                            />
                            Sync Now
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={onConnect}
                            className="h-8 gap-2 rounded-full bg-zinc-900 px-5 text-xs font-medium text-white shadow-sm hover:bg-zinc-800"
                        >
                            Connect
                        </Button>
                    )}
                </div>
            </div>

            {/* Success Animation Flash */}
            <AnimatePresence>
                {status === "connected" && !isSyncing && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, rotate: -45 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="absolute right-4 top-4 pointer-events-none text-emerald-500/10"
                    >
                        <CheckCircle2 className="h-24 w-24" />
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
