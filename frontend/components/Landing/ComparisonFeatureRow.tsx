"use client";

import { type LucideIcon, XCircle, CheckCircle2 } from "lucide-react";

interface ComparisonFeatureRowProps {
    title: string;
    competitorDescription: string;
    synapseDescription: string;
    categoryIcon: LucideIcon;
}

export default function ComparisonFeatureRow({
    title,
    competitorDescription,
    synapseDescription,
    categoryIcon: Icon,
}: ComparisonFeatureRowProps) {
    return (
        <div className="group py-5 first:pt-0 last:pb-0 border-b border-white/[0.04] last:border-b-0">
            {/* Row title with category icon */}
            <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-zinc-500" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {title}
                </h4>
            </div>

            {/* Two-column comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Competitor — muted / negative */}
                <div className="flex items-start gap-2.5">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400/70" />
                    <p className="text-sm leading-relaxed text-zinc-500">
                        {competitorDescription}
                    </p>
                </div>

                {/* Synapse — vibrant / positive */}
                <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <p className="text-sm leading-relaxed text-zinc-200">
                        {synapseDescription}
                    </p>
                </div>
            </div>
        </div>
    );
}
