"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Brain,
    MessageSquare,
    Database,
    Settings,
    Bot,
    ChevronLeft,
    ChevronRight,
    Search,
    Calendar
} from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming utils exists for classNames

const sidebarItems = [
    {
        name: "Chat & Orchestrator",
        href: "/dashboard",
        icon: MessageSquare,
    },
    {
        name: "Knowledge Base",
        href: "/dashboard/knowledge",
        icon: Database,
    },
    {
        name: "Agents",
        href: "/dashboard/agents",
        icon: Bot,
    },
    {
        name: "Meetings",
        href: "/dashboard/meetings",
        icon: Calendar,
    },
    {
        name: "Research",
        href: "/dashboard/research",
        icon: Search,
    },
    {
        name: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
];

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    return (
        <aside
            className={cn(
                "relative flex h-screen flex-col border-r border-[#E5E5E5] bg-[#F9F9F9] transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-900/50",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            {/* Header / Logo */}
            <div className="flex h-14 items-center justify-between px-4 mt-2">
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            Synapse OS
                        </span>
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-neutral-200/50 dark:hover:bg-neutral-800"
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-neutral-500" />
                    ) : (
                        <ChevronLeft className="h-4 w-4 text-neutral-500" />
                    )}
                </button>
            </div>

            {/* Quick Actions (Command / Search) */}
            {!isCollapsed && (
                <div className="px-3 mt-4 mb-2">
                    <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-500 hover:bg-neutral-200/50 dark:text-neutral-400 dark:hover:bg-neutral-800">
                        <Search className="h-4 w-4 shrink-0" />
                        <span>Search</span>
                        <span className="ml-auto text-xs opacity-60">Ctrl+K</span>
                    </button>
                </div>
            )}

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1 px-3 mt-4 overflow-y-auto">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                                    : "text-neutral-600 hover:bg-neutral-200/50 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
                                isCollapsed ? "justify-center" : ""
                            )}
                            title={isCollapsed ? item.name : undefined}
                        >
                            <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "opacity-100" : "opacity-70")} />
                            {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section (e.g., User Profile, Support) can go here */}
            {!isCollapsed && (
                <div className="mb-4 mt-auto px-4 text-xs text-neutral-400">
                    <p>Synapse v0.1.0</p>
                </div>
            )}
        </aside>
    );
}
