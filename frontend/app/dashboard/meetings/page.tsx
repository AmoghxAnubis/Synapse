"use client";

import { Calendar, CheckSquare, Plus, AlignLeft } from "lucide-react";
import { useState } from "react";

export default function MeetingsPage() {
    const [notes, setNotes] = useState("");
    const [tasks, setTasks] = useState([
        { id: 1, text: "Review latest system architecture", completed: false },
        { id: 2, text: "Update notion dashboard plan", completed: true },
    ]);
    const [newTask, setNewTask] = useState("");

    const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && newTask.trim()) {
            setTasks([...tasks, { id: Date.now(), text: newTask.trim(), completed: false }]);
            setNewTask("");
        }
    };

    const toggleTask = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    return (
        <div className="flex h-full flex-col max-w-6xl mx-auto">
            {/* Header */}
            <header className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
                <div>
                    <nav className="text-sm text-neutral-500 font-medium mb-1">
                        <span className="hover:text-neutral-800 cursor-pointer dark:text-neutral-400 dark:hover:text-neutral-200">
                            Synapse
                        </span>
                        <span className="mx-2">/</span>
                        <span className="text-neutral-900 dark:text-neutral-100">
                            Meetings
                        </span>
                    </nav>
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Calendar className="h-6 w-6" />
                        Meetings & Notes
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button className="bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        New Note
                    </button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 pb-4">
                {/* Left: Notepad built like Notion */}
                <div className="lg:col-span-2 flex flex-col bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden h-full">
                    <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 p-3 bg-neutral-50 dark:bg-neutral-800/50">
                        <AlignLeft className="h-4 w-4 text-neutral-500" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Meeting Notes</span>
                    </div>
                    <textarea
                        className="flex-1 w-full resize-none p-6 focus:outline-none bg-transparent text-neutral-800 dark:text-neutral-200 leading-relaxed placeholder:text-neutral-400 font-sans"
                        placeholder="Start typing your meeting notes here..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {/* Right: Action Items */}
                <div className="flex flex-col bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden h-full">
                    <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 p-3 bg-neutral-50 dark:bg-neutral-800/50">
                        <CheckSquare className="h-4 w-4 text-neutral-500" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Action Items</span>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto w-full">
                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <div key={task.id} className="flex items-start gap-3 group">
                                    <button
                                        onClick={() => toggleTask(task.id)}
                                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${task.completed ? 'bg-neutral-800 border-neutral-800 dark:bg-neutral-200 dark:border-neutral-200' : 'border-neutral-300 dark:border-neutral-600'}`}
                                    >
                                        {task.completed && <CheckSquare className="h-3 w-3 text-white dark:text-neutral-900" />}
                                    </button>
                                    <span className={`text-sm ${task.completed ? 'text-neutral-400 line-through dark:text-neutral-600' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                        {task.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="+ Add a task (press Enter)"
                            className="mt-4 w-full bg-transparent text-sm focus:outline-none text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-400"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            onKeyDown={handleAddTask}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
