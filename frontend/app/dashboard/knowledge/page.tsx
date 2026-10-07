"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import MemoryDropzone from "@/components/MemoryDropzone";
import { fetchSources, deleteSource, ingestURL, errorMessage, type Source } from "@/lib/api";

export default function KnowledgePage() {
  const [sources, setSources] = useState<Source[]>([]); const [url, setURL] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async () => { try { setSources(await fetchSources()); setError(""); } catch (e) { setError(errorMessage(e)); } }, []);
  useEffect(() => { fetchSources().then(setSources).catch(e => setError(errorMessage(e))); }, []);
  return <section className="max-w-5xl mx-auto space-y-6">
    <header><h1 className="text-2xl font-semibold">Knowledge</h1><p className="mt-2 text-sm text-neutral-500">Import documents once, keep them searchable, and verify the passages used in answers.</p></header>
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="space-y-5"><MemoryDropzone onUploadSuccess={load} />
        <form className="rounded-xl border p-5 space-y-3" onSubmit={async e => {
          e.preventDefault(); setBusy(true); setError("");
          try { await ingestURL(url); setURL(""); await load(); toast.success("Web page imported."); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
        }}><label className="block text-sm font-medium">Import a public page<input required type="url" value={url} onChange={e => setURL(e.target.value)} placeholder="https://?" className="mt-2 w-full rounded-lg border p-2 text-sm bg-transparent" /></label>
          <p className="text-xs text-neutral-500">Contacts the site you enter. Requires connected features in Settings.</p>
          <button disabled={busy} className="text-sm rounded-lg border px-3 py-2 disabled:opacity-50">{busy ? "Importing?" : "Import page"}</button>
        </form>
        <Link href="/settings/integrations" className="inline-block text-sm text-indigo-500">Connect workspace sources ?</Link>
      </div>
      <section className="lg:col-span-2 rounded-xl border p-5"><h2 className="font-semibold mb-4">Imported sources ? {sources.length}</h2>
        {!sources.length && <p className="text-sm text-neutral-500 py-10">Add a document to begin. If the embedding model is missing, follow the model setup steps in the README.</p>}
        <ul className="divide-y dark:divide-neutral-800">{sources.map(s => <li key={s.name} className="py-4 flex gap-3 items-center">
          <div className="min-w-0 flex-1"><Link href={"/dashboard/knowledge/source?name=" + encodeURIComponent(s.name)} className="text-sm font-medium break-all text-indigo-500">{s.name}</Link><p className="mt-1 text-xs text-neutral-500">{s.chunks} passages ? {s.platform || "local"}</p></div>
          <button className="text-xs text-neutral-500" onClick={async () => { if (!confirm("Delete all imported passages for " + s.name + "?")) return; try { await deleteSource(s.name); await load(); } catch (e) { setError(errorMessage(e)); } }}>Delete</button>
        </li>)}</ul>
      </section>
    </div>
  </section>;
}
