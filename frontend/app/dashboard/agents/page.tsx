"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { fetchAgents, updateAgent, deleteAgent, fetchSources, errorMessage, type Agent, type Source } from "@/lib/api";

function AgentEditor({ agent, sources, onSaved }: { agent: Agent; sources: Source[]; onSaved: (agent: Agent) => void }) {
  const [prompt, setPrompt] = useState(agent.system_instruction);
  const [capabilities, setCapabilities] = useState(agent.capabilities);
  const [linked, setLinked] = useState(agent.linked_sources);
  const [integrations, setIntegrations] = useState(agent.integrations);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  return <form className="rounded-xl border p-6 space-y-6" onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError("");
    try { onSaved(await updateAgent(agent.id, { system_instruction: prompt, capabilities, linked_sources: linked, integrations })); toast.success("Agent saved."); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }}>
    <header><h2 className="text-xl font-semibold">{agent.name}</h2><p className="mt-2 text-sm text-neutral-500">{agent.description}</p></header>
    <label className="block text-sm font-medium">Instructions<textarea value={prompt} onChange={e => setPrompt(e.target.value)} maxLength={10000} className="w-full min-h-40 mt-2 rounded-lg border bg-transparent p-3 text-sm font-normal" /></label>
    <fieldset className="space-y-3"><legend className="text-sm font-medium mb-3">Capabilities</legend>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={capabilities.web_search} onChange={e => setCapabilities({ ...capabilities, web_search: e.target.checked })} />Allow web search, with request-specific consent</label>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={capabilities.terminal} onChange={e => setCapabilities({ ...capabilities, terminal: e.target.checked })} />Allow fixed diagnostics and approved app launching</label>
    </fieldset>
    <fieldset><legend className="text-sm font-medium">Document scope</legend><p className="text-xs text-neutral-500 mt-2 mb-3">No selection allows all imported sources. A selection restricts retrieval and intersects with the sources selected in Chat.</p>
      <div className="max-h-48 overflow-y-auto space-y-2">{sources.map(source => <label key={source.name} className="flex items-center gap-3 text-xs"><input type="checkbox" checked={linked.includes(source.name)} onChange={e => setLinked(e.target.checked ? [...linked, source.name] : linked.filter(v => v !== source.name))} /><span className="break-all">{source.name}</span></label>)}</div>
    </fieldset>
    <fieldset className="space-y-2"><legend className="text-sm font-medium mb-3">Allowed connected actions</legend>
      {["github", "slack", "discord"].map(platform => <label key={platform} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={integrations.includes(platform)} onChange={e => setIntegrations(e.target.checked ? [...integrations, platform] : integrations.filter(v => v !== platform))} />{platform}</label>)}
      <p className="text-xs text-neutral-500">Connections must be configured separately. Every external write still requires approval in Actions.</p>
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    <button disabled={busy} className="rounded-lg bg-indigo-600 text-white px-4 py-2 disabled:opacity-50">{busy ? "Saving?" : "Save agent"}</button>
  </form>;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]); const [sources, setSources] = useState<Source[]>([]);
  const [selected, setSelected] = useState<number | null>(null); const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([fetchAgents(), fetchSources().catch(() => [])]).then(([a, s]) => {
      if (active) { setAgents(a); setSources(s); setSelected(a[0]?.id ?? null); }
    }).catch(e => { if (active) setError(errorMessage(e)); });
    return () => { active = false; };
  }, []);
  const current = agents.find(a => a.id === selected);
  return <section className="max-w-5xl mx-auto space-y-6">
    <header className="flex justify-between items-center gap-3"><div><h1 className="text-2xl font-semibold">Agents</h1><p className="mt-2 text-sm text-neutral-500">Specialize instructions and permissions without granting automatic actions.</p></div><Link href="/dashboard/agents/create" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">Create agent</Link></header>
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    <div className="grid lg:grid-cols-3 gap-6"><nav aria-label="Agents" className="space-y-3">{agents.map(a => <div key={a.id} className={"rounded-xl border p-4 " + (selected === a.id ? "border-indigo-500" : "")}>
      <button onClick={() => setSelected(a.id)} className="text-left w-full"><span className="font-medium text-sm">{a.name}</span><p className="mt-2 text-xs text-neutral-500">{a.description}</p></button>
      {![1, 2, 3].includes(a.id) && <button className="mt-3 text-xs text-red-500" onClick={async () => {
        if (!confirm("Delete " + a.name + "?")) return;
        try { await deleteAgent(a.id); setAgents(prev => prev.filter(v => v.id !== a.id)); if (selected === a.id) setSelected(null); } catch (e) { setError(errorMessage(e)); }
      }}>Delete</button>}
    </div>)}</nav>
      <div className="lg:col-span-2">{current ? <AgentEditor key={current.id} agent={current} sources={sources} onSaved={updated => setAgents(prev => prev.map(a => a.id === updated.id ? updated : a))} /> : <p className="p-6 text-neutral-500">Select an agent to configure it.</p>}</div>
    </div>
  </section>;
}
