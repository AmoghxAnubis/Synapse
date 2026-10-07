"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Square, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { fetchSources, fetchAgents, fetchConversations, fetchConversation, newConversation, deleteConversation, streamAnswer, errorMessage, type Source, type Agent, type Conversation } from "@/lib/api";
import MessageBubble, { type Message } from "./MessageBubble";
import ChatInput from "./ChatInput";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [agentId, setAgentId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [allowWeb, setAllowWeb] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const selectedAgent = agents.find(a => a.id === agentId);

  useEffect(() => {
    let active = true;
    Promise.all([fetchSources().catch(() => []), fetchAgents(), fetchConversations()])
      .then(([s, a, c]) => { if (active) { setSources(s); setAgents(a); setConversations(c); } })
      .catch(e => { if (active) setError(errorMessage(e)); });
    return () => { active = false; controller.current?.abort(); };
  }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function open(id: string) {
    if (busy) return;
    setLoadingHistory(true); setError("");
    try {
      const saved = await fetchConversation(id);
      setMessages(saved.map(m => ({ id: m.id, role: m.role, content: m.content, citations: m.citations, timestamp: new Date(m.created * 1000) })));
      setConversationId(id);
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoadingHistory(false); }
  }
  async function send(text: string) {
    if (busy || loadingHistory) return;
    setBusy(true); setError("");
    const abort = new AbortController(); controller.current = abort;
    const assistantId = crypto.randomUUID();
    try {
      let id = conversationId;
      if (!id) { const created = await newConversation(); id = created.id; setConversationId(id); }
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() }, { id: assistantId, role: "ai", content: "", timestamp: new Date() }]);
      await streamAnswer(text, selectedSources, agentId, id, allowWeb && !!selectedAgent?.capabilities.web_search, abort.signal, event => {
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + (event.text || ""), citations: event.citations || m.citations } : m));
      });
      setConversations(await fetchConversations());
    } catch (e) {
      if (abort.signal.aborted) { toast.info("Answer stopped. Partial answers are not saved."); }
      else setError(errorMessage(e));
    } finally { controller.current = null; setBusy(false); }
  }
  return <section className="flex flex-col h-full min-h-[70vh]">
    <header className="mb-5 flex flex-wrap gap-3 items-center">
      <div className="flex-1"><h1 className="text-2xl font-semibold">Your local memory</h1><p className="mt-1 text-sm text-neutral-500">Ask about imported documents. Open the evidence to verify an answer.</p></div>
      <select aria-label="Conversation" disabled={busy || loadingHistory} value={conversationId || ""} onChange={e => { if (e.target.value) void open(e.target.value); }} className="max-w-56 rounded-lg border bg-transparent p-2 text-sm">
        <option value="">New conversation</option>{conversations.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select>
      <button aria-label="New conversation" disabled={busy || loadingHistory} onClick={() => { setConversationId(null); setMessages([]); setError(""); }} className="rounded-lg border p-2"><Plus className="h-4 w-4" /></button>
      {conversationId && <button aria-label="Delete conversation" disabled={busy || loadingHistory} onClick={async () => {
        if (!confirm("Delete this conversation?")) return;
        try { await deleteConversation(conversationId); setConversationId(null); setMessages([]); setConversations(await fetchConversations()); } catch (e) { toast.error(errorMessage(e)); }
      }} className="rounded-lg border p-2"><Trash2 className="h-4 w-4" /></button>}
    </header>
    <div className="flex-1 min-h-0 overflow-y-auto space-y-5 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950">
      {!messages.length && <div className="py-16 text-center text-neutral-500"><p>Start with a document in Knowledge.</p><p className="mt-2 text-sm">Then ask a question here, or select a source with @.</p></div>}
      {loadingHistory && <p role="status">Loading conversation?</p>}
      {messages.map(m => <MessageBubble key={m.id} msg={m} />)}<div ref={bottom} />
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-red-500">{error}</p>}
    <div className="mt-3 flex flex-wrap gap-2">
      {selectedAgent && <button onClick={() => setAgentId(null)} className="flex gap-1 items-center rounded-full bg-indigo-50 dark:bg-indigo-950 px-3 py-1 text-xs">{selectedAgent.name}<X className="h-3 w-3" /></button>}
      {selectedSources.map(s => <button key={s} onClick={() => setSelectedSources(prev => prev.filter(v => v !== s))} className="flex gap-1 items-center rounded-full border px-3 py-1 text-xs">{s}<X className="h-3 w-3" /></button>)}
    </div>
    {selectedAgent?.capabilities.web_search && <label className="mt-3 text-xs text-neutral-500 flex gap-2"><input type="checkbox" checked={allowWeb} onChange={e => setAllowWeb(e.target.checked)} />Include web search: sends this question to a search provider. Enable connected features in Settings first.</label>}
    {busy && <button onClick={() => controller.current?.abort()} className="self-start flex items-center gap-2 text-sm mt-3 text-indigo-500"><Square className="h-3 w-3" />Stop answer</button>}
    <ChatInput onSend={send} isLoading={busy || loadingHistory} availableSources={sources.map(s => s.name)} selectedSources={selectedSources} onAddSource={s => setSelectedSources(prev => [...prev, s])} availableAgents={agents} activeAgentId={agentId} onSelectAgent={setAgentId} />
  </section>;
}
