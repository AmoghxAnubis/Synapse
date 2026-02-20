"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { uploadDocument, type UploadResponse } from "@/lib/api";
import { toast } from "sonner";

interface UploadedFile {
    filename: string;
    chunks: number;
    hardware: string;
    timestamp: Date;
}

export default function MemoryDropzone() {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = useCallback(async (file: File) => {
        setIsUploading(true);
        try {
            const result: UploadResponse = await uploadDocument(file);
            const uploaded: UploadedFile = {
                filename: result.filename,
                chunks: result.chunks_processed,
                hardware: result.hardware,
                timestamp: new Date(),
            };
            setUploadedFiles((prev) => [uploaded, ...prev]);
            toast.success(`Ingested: ${result.filename}`, {
                description: `${result.chunks_processed} chunks processed via ${result.hardware}`,
            });
        } catch {
            toast.error("Upload failed", {
                description: "Could not reach Synapse backend.",
            });
        } finally {
            setIsUploading(false);
        }
    }, []);

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleUpload(file);
        },
        [handleUpload]
    );

    const onFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
        },
        [handleUpload]
    );

    return (
        <div className="flex h-full flex-col gap-4">
            {/* Title */}
            <div className="flex items-center gap-2 px-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-semibold tracking-wide text-zinc-800 uppercase">
                    Memory Bank
                </h2>
            </div>

            {/* Dropzone */}
            <motion.div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                whileHover={{ scale: 1.01 }}
                className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-all duration-300 ${isDragging
                        ? "border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-100"
                        : "border-zinc-300 bg-zinc-50/50 hover:border-zinc-400 hover:bg-zinc-50"
                    }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.md,.doc,.docx"
                    onChange={onFileSelect}
                />

                <AnimatePresence mode="wait">
                    {isUploading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        </motion.div>
                    ) : isDragging ? (
                        <motion.div
                            key="dragging"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <Upload className="h-8 w-8 text-zinc-400" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="text-center">
                    <p className="text-sm font-medium text-zinc-700">
                        {isDragging ? "Drop to ingest" : "Drag files here"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">PDF, TXT, MD, DOC</p>
                </div>
            </motion.div>

            {/* Recent uploads */}
            {uploadedFiles.length > 0 && (
                <div className="flex flex-col gap-2">
                    <span className="px-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Recent Ingestions
                    </span>
                    <ScrollArea className="max-h-48">
                        <div className="flex flex-col gap-1.5">
                            <AnimatePresence>
                                {uploadedFiles.map((f, i) => (
                                    <motion.div
                                        key={`${f.filename}-${i}`}
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Card className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm">
                                            <FileText className="h-4 w-4 shrink-0 text-emerald-600" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-medium text-zinc-800">
                                                    {f.filename}
                                                </p>
                                                <p className="text-[10px] text-zinc-500">
                                                    {f.chunks} chunks · {f.hardware}
                                                </p>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
}
