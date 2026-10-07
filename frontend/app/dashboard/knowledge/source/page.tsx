"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchSource, errorMessage, type Citation } from "@/lib/api";

function SourceView() {
  const name = useSearchParams().get("name") || "";
  const [chunks, setChunks] = useState<Citation[]>([]); const [error, setError] = useState("");
  useEffect(() => { fetchSource(name).then(setChunks).catch(e => setError(errorMessage(e))); }, [name]);
  return <section className="max-w-4xl mx-auto space-y-5">
    <Link href="/dashboard/knowledge" className="text-indigo-500 text-sm">? Knowledge</Link>
    <h1 className="text-xl font-semibold break-all">{name}</h1>
    {error && <p role="alert">{error}</p>}
    {chunks.map(chunk => <article key={chunk.id} className="rounded-xl border p-5">
      <h2 className="text-xs text-neutral-500 mb-3">Page {chunk.page} ? Passage {chunk.chunk}</h2>
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{chunk.text}</p>
    </article>)}
    {!chunks.length && !error && <p className="text-neutral-500">No imported passages are available for this source.</p>}
  </section>;
}
export default function SourcePage() { return <Suspense fallback={<p>Loading source?</p>}><SourceView /></Suspense>; }
