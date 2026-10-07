"use client";
import { useState, useRef } from "react";
import { UploadCloud, Square } from "lucide-react";
import { uploadDocument, errorMessage } from "@/lib/api";
import { toast } from "sonner";

export default function MemoryDropzone({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [status, setStatus] = useState(""); const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  async function upload(file?: File) {
    if (!file || busy) return;
    if (file.size > 20 * 1024 * 1024) { setError("Files must be smaller than 20 MB."); return; }
    if (!/\.(pdf|txt|md|py|docx)$/i.test(file.name)) { setError("Choose a PDF, TXT, MD, PY, or DOCX file."); return; }
    const abort = new AbortController(); controller.current = abort;
    setBusy(true); setError(""); setStatus("Importing " + file.name + "?");
    try {
      const result = await uploadDocument(file, abort.signal);
      setStatus(result.filename + " ? " + result.chunks_processed + " passages" + (result.unchanged ? " ? already up to date" : ""));
      toast.success(result.unchanged ? "Document is already up to date." : "Document imported.");
      onUploadSuccess?.();
    } catch (e) { setError(abort.signal.aborted ? "Import cancelled." : errorMessage(e)); setStatus(""); }
    finally { setBusy(false); controller.current = null; if (input.current) input.current.value = ""; }
  }
  return <section className="space-y-4">
    <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void upload(e.dataTransfer.files[0]); }} className="rounded-2xl border-2 border-dashed p-8 text-center bg-neutral-50 dark:bg-neutral-950">
      <UploadCloud className="mx-auto h-8 w-8 text-indigo-500" /><h2 className="mt-4 font-medium">Add to your knowledge</h2>
      <p className="mt-2 text-xs text-neutral-500">PDF, TXT, MD, PY, DOCX ? up to 20 MB</p>
      <button disabled={busy} onClick={() => input.current?.click()} className="mt-5 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm disabled:opacity-50">{busy ? "Importing?" : "Choose a file"}</button>
      <input ref={input} aria-label="Document file" type="file" accept=".pdf,.txt,.md,.py,.docx" className="sr-only" onChange={e => void upload(e.target.files?.[0])} />
      {busy && <button onClick={() => controller.current?.abort()} className="mt-4 flex items-center justify-center gap-2 w-full text-xs"><Square className="h-3 w-3" />Cancel import</button>}
    </div>
    {status && <p role="status" className="text-xs text-neutral-500 break-all">{status}</p>}
    {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
  </section>;
}
