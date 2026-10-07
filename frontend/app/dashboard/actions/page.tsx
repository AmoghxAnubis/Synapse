"use client";
import { useState, useEffect } from "react";
import { fetchAgents, previewAction, approveAction, cancelAction, runTerminal, fetchAudit, errorMessage, type Agent, type ActionPreview } from "@/lib/api";
import { toast } from "sonner";

export default function ActionsPage() {
  const [agents, setAgents] = useState<Agent[]>([]); const [agentId, setAgentId] = useState<number>(0);
  const [action, setAction] = useState("open_app");
  const [destination, setDestination] = useState("notepad"); const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [preview, setPreview] = useState<ActionPreview | null>(null); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); const [output, setOutput] = useState("");
  const [audit, setAudit] = useState<{ id: number; action: string; outcome: string; created: number }[]>([]);
  useEffect(() => {
    fetchAgents().then(data => { setAgents(data); setAgentId(data.find(a => a.capabilities.terminal)?.id || data[0]?.id || 0); }).catch(e => setError(errorMessage(e)));
    fetchAudit().then(setAudit).catch(() => {});
  }, []);
  const field = "block w-full mt-2 rounded-lg border bg-transparent p-3 text-sm";
  return <section className="max-w-3xl mx-auto space-y-6">
    <header><h1 className="text-2xl font-semibold">Actions</h1><p className="mt-2 text-sm text-neutral-500">Choose an action, review its destination and content, then approve it. Chat never runs actions automatically.</p></header>
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    <form className="rounded-xl border p-6 space-y-5" onSubmit={async e => {
      e.preventDefault(); setBusy(true); setError("");
      const params: Record<string, string> = action === "open_app" ? { app: destination } : action === "github.create_issue" ? { repository: destination, title, body } : { channel: destination, text: body };
      try { setPreview(await previewAction(action, params, agentId)); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
    }}>
      <label className="block text-sm">Agent<select value={agentId} onChange={e => setAgentId(Number(e.target.value))} className={field}>{agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      <label className="block text-sm">Action<select value={action} onChange={e => { setAction(e.target.value); setDestination(e.target.value === "open_app" ? "notepad" : ""); setPreview(null); }} className={field}>
        <option value="open_app">Open a local app</option><option value="github.create_issue">Create a GitHub issue</option><option value="slack.send_message">Send a Slack message</option><option value="discord.send_message">Send a Discord message</option>
      </select></label>
      {action === "open_app" ? <label className="block text-sm">App<select value={destination} onChange={e => setDestination(e.target.value)} className={field}><option value="notepad">Notepad</option><option value="calculator">Calculator</option><option value="paint">Paint</option></select></label> :
        <><label className="block text-sm">{action === "github.create_issue" ? "Repository (owner/name)" : "Channel ID"}<input required value={destination} onChange={e => setDestination(e.target.value)} className={field} /></label>
          {action === "github.create_issue" && <label className="block text-sm">Issue title<input required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} className={field} /></label>}
          <label className="block text-sm">{action === "github.create_issue" ? "Description" : "Message"}<textarea required={action !== "github.create_issue"} maxLength={2000} value={body} onChange={e => setBody(e.target.value)} className={field} /></label>
        </>}
      <button disabled={busy || !agentId || !!preview} className="rounded-lg bg-indigo-600 px-4 py-3 text-white disabled:opacity-50">{busy ? "Preparing?" : "Review action"}</button>
    </form>
    {preview && <section aria-label="Action approval" className="rounded-xl border border-amber-400 p-6 space-y-4">
      <h2 className="font-semibold">Review before approving</h2><p className="text-sm whitespace-pre-wrap break-words">{preview.description}</p>
      <p className="text-xs text-neutral-500">Approval expires in five minutes and can be used once. Verify the destination and content.</p>
      <div className="flex gap-4"><button disabled={busy} className="rounded-lg bg-indigo-600 text-white px-4 py-2" onClick={async () => {
        setBusy(true); setError("");
        try { const result = await approveAction(preview.id); toast.success(result.message); setOutput(result.message + (result.url ? "\n" + result.url : "")); }
        catch (e) { setError(errorMessage(e)); } finally { setPreview(null); setBusy(false); setAudit(await fetchAudit()); }
      }}>Approve and run</button>
        <button disabled={busy} onClick={async () => { try { await cancelAction(preview.id); setPreview(null); setAudit(await fetchAudit()); } catch (e) { setError(errorMessage(e)); } }}>Cancel</button></div>
    </section>}
    <section className="rounded-xl border p-6 space-y-3"><h2 className="font-semibold">Local diagnostics</h2><p className="text-sm text-neutral-500">Only these fixed commands are available. The selected agent must allow diagnostics.</p>
      <div className="flex gap-3 flex-wrap">{["python-version", "git-version", "git-status"].map(command => <button key={command} disabled={busy} className="rounded-lg border px-3 py-2 text-xs" onClick={async () => {
        setBusy(true); setError("");
        try { const result = await runTerminal(command, agentId); if (result.blocked || result.exit_code !== 0) throw new Error(result.stderr); setOutput(result.stdout); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
      }}>{command}</button>)}</div>
      {output && <pre className="text-xs whitespace-pre-wrap bg-neutral-50 dark:bg-neutral-950 rounded-lg p-4">{output}</pre>}
    </section>
    <section className="rounded-xl border p-6"><h2 className="font-semibold mb-4">Recent activity</h2><ul className="space-y-2 text-xs text-neutral-500">{audit.slice(0, 20).map(a => <li key={a.id}>{new Date(a.created * 1000).toLocaleString()} ? {a.action} ? {a.outcome}</li>)}</ul></section>
  </section>;
}
