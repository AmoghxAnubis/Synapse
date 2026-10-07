"use client";
import { useState } from "react";
import { askSynapse, errorMessage, type AskResponse } from "@/lib/api";
import MessageBubble from "@/components/MessageBubble";

export default function ResearchPage() {
  const [query, setQuery] = useState(""); const [result, setResult] = useState<AskResponse | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  return <section className="max-w-4xl mx-auto space-y-6">
    <header><h1 className="text-2xl font-semibold">Search your knowledge</h1><p className="mt-2 text-sm text-neutral-500">Find an answer in your local imported sources. Use Chat for follow-up questions and optional web search.</p></header>
    <form className="flex gap-3" onSubmit={async e => {
      e.preventDefault(); setBusy(true); setError(""); setResult(null);
      try { setResult(await askSynapse(query)); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
    }}><input aria-label="Research question" required value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 flex-1 rounded-xl border p-3 bg-transparent text-sm" placeholder="What do your documents say about??" /><button disabled={busy} className="rounded-xl bg-indigo-600 px-5 text-white disabled:opacity-50">{busy ? "Searching?" : "Search"}</button></form>
    {error && <p role="alert" className="text-red-500 text-sm">{error}</p>}
    {result && <MessageBubble msg={{ id: "result", role: "ai", content: result.answer, citations: result.citations, timestamp: new Date() }} />}
  </section>;
}
