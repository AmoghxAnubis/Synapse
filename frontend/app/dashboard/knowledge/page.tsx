"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import MemoryDropzone from "@/components/MemoryDropzone";
import { Database } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { listMemory, deleteMemory, clearMemory, toggleContext, getStatus } from "@/lib/api";

export default function KnowledgeBase() {
  const [memoryItems, setMemoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useContext, setUseContext] = useState(true);
  const [status, setStatus] = useState({});

  useEffect(() => {
    loadMemory();
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const s = await getStatus();
      setUseContext(s.use_context);
      setStatus(s);
    } catch {
      setUseContext(true);
    }
  };

  const handleToggleContext = async (checked: boolean) => {
    try {
      await toggleContext(checked);
      setUseContext(checked);
      toast.success(checked ? "Context enabled" : "Context disabled (plain chat)");
    } catch {
      toast.error("Toggle failed");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Clear ALL memory? Irreversible.")) return;
    try {
      await clearMemory();
      setMemoryItems([]);
      toast.success("Memory cleared");
    } catch {
      toast.error("Clear failed");
    }
  };

  const loadMemory = async () => {
    try {
      const items = await listMemory(50);
      setMemoryItems(items);
    } catch {
      setMemoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteMemory([id]);
      loadMemory(); // Reload full list
    } catch {}
  };

  const { toast } = useToast();

  return (
        <div className="flex h-full flex-col">
            {/* Page Header */}
            <header className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
                <div>
                    <nav className="text-sm text-neutral-500 font-medium mb-1">
                        <span className="hover:text-neutral-800 cursor-pointer dark:text-neutral-400 dark:hover:text-neutral-200">
                            Synapse
                        </span>
                        <span className="mx-2">/</span>
                        <span className="text-neutral-900 dark:text-neutral-100">
                            Knowledge Base
                        </span>
                    </nav>
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Database className="h-6 w-6" />
                        Memory & Knowledge
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button className="bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
                        Add Source
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left col - Dropzone (taking up 1 col) */}
                <div className="lg:col-span-1">
                    <MemoryDropzone />
                    <p className="text-sm text-neutral-500 mt-4 dark:text-neutral-400">
                        Upload documents (PDF, TXT, MD, DOCX) to expand Synapse's knowledge base.
                        Files are processed locally and stored securely.
                    </p>
                </div>

                {/* Right col - List of uploaded sources (taking up 2 cols) */}
                <div className="lg:col-span-2">
                    <div className="mb-6">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                            Stored Memories ({memoryItems.length})
                        </h3>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">Context:</span>
                            <Switch checked={useContext} onCheckedChange={handleToggleContext} />
                        </div>
                        {memoryItems.length > 0 && (
                          <Button variant="outline" size="sm" onClick={handleClearAll} className="h-8 gap-1.5">
                            <Trash2 className="h-3.5 w-3.5" />
                            Clear All
                          </Button>
                        )}
                    </div>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : memoryItems.length === 0 ? (
                        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 p-6 flex flex-col items-center justify-center text-center">
                            <Database className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mb-4" />
                            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                                No Knowledge Sources Yet
                            </h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
                                Upload your first document using the dropzone on the left. Synapse will process it and index it for future conversations.
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[500px]">
                            <div className="space-y-2">
                                {memoryItems.map((item, index) => (
                                    <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">
                                                    {item.source}
                                                </p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                                    {item.document}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => deleteItem(item.id)}
                                                className="text-neutral-400 hover:text-red-500 transition-colors p-1 -m-1 rounded-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </div>
        </div>
    );
}
