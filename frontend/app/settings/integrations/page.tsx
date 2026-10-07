"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plug } from "lucide-react";
import { toast } from "sonner";
import ConnectModal from "@/components/ConnectModal";
import { fetchIntegrationStatuses, saveIntegrationKey, disconnectIntegration, triggerSync, errorMessage, type Platform, type IntegrationStatusEntry } from "@/lib/api";

const platforms: { id: Platform; name: string; description: string }[] = [
  { id: "github", name: "GitHub", description: "Selected repositories: README, issue and PR descriptions, and comments." },
  { id: "notion", name: "Notion", description: "Selected pages and nested text blocks shared with your integration." },
  { id: "jira", name: "Jira", description: "Selected Jira Cloud projects: issue descriptions, status, and available comments." },
  { id: "slack", name: "Slack", description: "Message history in the channels your bot can access." },
  { id: "discord", name: "Discord", description: "Message content in selected channels your bot can access." },
];
export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState<Partial<Record<Platform, IntegrationStatusEntry>>>({});
  const [selected, setSelected] = useState<typeof platforms[number] | null>(null);
  const [busy, setBusy] = useState<Platform | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { fetchIntegrationStatuses().then(setStatuses).catch(e => setError(errorMessage(e))); }, []);
  return <section className="max-w-5xl mx-auto p-6 space-y-6">
    <Link href="/dashboard/settings" className="text-sm text-indigo-500">? Workspace settings</Link>
    <header><h1 className="text-2xl font-semibold">Connected sources</h1><p className="text-sm text-neutral-500 mt-2">Enable connected features in Settings, then choose exactly what to import. Model inference remains local.</p></header>
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    <div className="grid sm:grid-cols-2 gap-4">{platforms.map(p => <article key={p.id} className="rounded-xl border p-6 space-y-4">
      <h2 className="font-semibold flex items-center gap-2"><Plug className="h-4 w-4" />{p.name}</h2><p className="text-sm text-neutral-500">{p.description}</p>
      <p className="text-xs">{statuses[p.id]?.connected ? "Connected" : "Disconnected"}{statuses[p.id]?.last_synced ? " ? Synced " + new Date(statuses[p.id]!.last_synced!).toLocaleString() : ""}</p>
      {!!statuses[p.id]?.resources?.length && <p className="text-xs text-neutral-500 break-all">{statuses[p.id]?.resources?.join(", ")}</p>}
      <div className="flex flex-wrap gap-3 text-sm">
        <button disabled={!!busy} onClick={() => setSelected(p)} className="rounded-lg border px-3 py-2">{statuses[p.id]?.connected ? "Edit connection" : "Connect"}</button>
        {statuses[p.id]?.connected && <>
          <button disabled={!!busy} className="rounded-lg bg-indigo-600 text-white px-3 py-2 disabled:opacity-50" onClick={async () => {
            setBusy(p.id); setError("");
            try { const result = await triggerSync(p.id); setLogs(prev => [p.name + ": " + result.documents_ingested + " documents checked, " + result.documents_changed + " updated.", ...prev].slice(0, 30)); setStatuses(await fetchIntegrationStatuses()); }
            catch (e) { setError(errorMessage(e)); } finally { setBusy(null); }
          }}>{busy === p.id ? "Importing?" : "Sync now"}</button>
          <button disabled={!!busy} className="text-neutral-500" onClick={async () => {
            if (!confirm("Disconnect " + p.name + "? Imported documents will remain in Knowledge until you delete them.")) return;
            try { await disconnectIntegration(p.id); setStatuses(await fetchIntegrationStatuses()); toast.success("Disconnected."); } catch (e) { setError(errorMessage(e)); }
          }}>Disconnect</button>
        </>}
      </div>
    </article>)}</div>
    <p className="text-xs text-neutral-500">Imports have explicit size limits. A limit or permission failure is reported; it is never treated as an empty successful sync. Message threads, attachments, and binary files are outside the current import scope.</p>
    {!!logs.length && <div className="rounded-xl border p-5 text-sm space-y-2" role="log">{logs.map((line, i) => <p key={i}>{line}</p>)}</div>}
    {selected && <ConnectModal key={selected.id} open={true} onOpenChange={open => { if (!open) setSelected(null); }} platformName={selected.name} platformIcon={<Plug />} onSubmit={async (key, resources, server, email) => {
      await saveIntegrationKey(selected.id, key, resources, server, email);
      setStatuses(await fetchIntegrationStatuses()); toast.success(selected.name + " connected.");
    }} />}
  </section>;
}
