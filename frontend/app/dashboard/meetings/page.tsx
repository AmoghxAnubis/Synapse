"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Check, Loader2 } from "lucide-react";
import { fetchMeetings, saveMeetings, type MeetingsData } from "@/lib/api";
import { toast } from "sonner";

interface Task {
    id: number;
    text: string;
    completed: boolean;
}

export default function MeetingsPage() {
    const [notes, setNotes] = useState("");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState("");
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Load from backend on mount
    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchMeetings();
                setNotes(data.notes || "");
                setTasks(data.tasks || []);
            } catch {
                // Fallback to localStorage
                try {
                    const stored = localStorage.getItem("synapse_meetings");
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        setNotes(parsed.notes || "");
                        setTasks(parsed.tasks || []);
                    }
                } catch {}
            } finally {
                setIsLoaded(true);
            }
        };
        load();
    }, []);

    // Debounced auto-save
    const persistData = useCallback(async (newNotes: string, newTasks: Task[]) => {
        const data: MeetingsData = { notes: newNotes, tasks: newTasks };
        // Always save to localStorage immediately
        localStorage.setItem("synapse_meetings", JSON.stringify(data));
        // Then try backend
        try {
            await saveMeetings(data);
        } catch {
            // Silent fail — localStorage has the data
        }
    }, []);

    // Auto-save with debounce
    useEffect(() => {
        if (!isLoaded) return;
        const timer = setTimeout(() => {
            persistData(notes, tasks);
        }, 1500);
        return () => clearTimeout(timer);
    }, [notes, tasks, isLoaded, persistData]);

    const handleAddTask = () => {
        if (!newTask.trim()) return;
        const task: Task = {
            id: Date.now(),
            text: newTask.trim(),
            completed: false,
        };
        setTasks((prev) => [...prev, task]);
        setNewTask("");
    };

    const toggleTask = (id: number) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
        );
    };

    const deleteTask = (id: number) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
    };

    const handleNewNote = () => {
        if (notes.trim() && !confirm("Clear current notes and start fresh?")) return;
        setNotes("");
    };

    if (!isLoaded) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col max-w-5xl mx-auto w-full">
            {/* Header */}
            <header className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
                <div>
                    <nav className="text-sm text-neutral-500 font-medium mb-1 dark:text-neutral-400">
                        <span>Synapse</span>
                        <span className="mx-2">/</span>
                        <span className="text-neutral-900 dark:text-neutral-100">Meetings</span>
                    </nav>
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-indigo-500" />
                        Meeting Notes
                    </h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleNewNote}
                        className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-md text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                    >
                        New Note
                    </button>
                    <button 
                        onClick={async () => {
                            setIsSaving(true);
                            await persistData(notes, tasks);
                            setIsSaving(false);
                            toast.success("Saved!");
                        }}
                        disabled={isSaving}
                        className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Save
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 pb-4">
                {/* Notes */}
                <div className="bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-700">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Notes</h3>
                        <p className="text-xs text-neutral-400 mt-0.5">Auto-saves as you type</p>
                    </div>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Start typing your meeting notes here..."
                        className="flex-1 p-5 bg-transparent text-sm text-neutral-800 dark:text-neutral-200 resize-none focus:outline-none font-mono leading-relaxed"
                    />
                </div>

                {/* Tasks */}
                <div className="bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-700">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Action Items</h3>
                        <p className="text-xs text-neutral-400 mt-0.5">{tasks.filter(t => t.completed).length}/{tasks.length} completed</p>
                    </div>

                    {/* Add Task */}
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                                placeholder="Add new task..."
                                className="flex-1 bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:text-neutral-200"
                            />
                            <button
                                onClick={handleAddTask}
                                className="p-2 bg-neutral-900 dark:bg-neutral-200 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-300 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Task List */}
                    <div className="flex-1 divide-y divide-neutral-100 dark:divide-neutral-700/50 overflow-y-auto">
                        {tasks.length === 0 ? (
                            <div className="p-8 text-center text-sm text-neutral-400">
                                No tasks yet. Add one above.
                            </div>
                        ) : (
                            tasks.map((task) => (
                                <div key={task.id} className="px-5 py-3 flex items-center gap-3 group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <button
                                        onClick={() => toggleTask(task.id)}
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                                            task.completed
                                                ? "bg-green-600 border-green-600"
                                                : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400"
                                        }`}
                                    >
                                        {task.completed && <Check className="h-3 w-3 text-white" />}
                                    </button>
                                    <span
                                        className={`flex-1 text-sm ${
                                            task.completed
                                                ? "line-through text-neutral-400"
                                                : "text-neutral-800 dark:text-neutral-200"
                                        }`}
                                    >
                                        {task.text}
                                    </span>
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 text-xs transition-all"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
