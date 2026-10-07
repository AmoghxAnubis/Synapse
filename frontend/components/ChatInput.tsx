"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, FileText } from "lucide-react";
import { type Agent } from "@/lib/api";

interface Props {
  onSend: (message: string) => void; isLoading: boolean;
  availableSources: string[]; selectedSources: string[];
  onAddSource: (name: string) => void; availableAgents: Agent[];
  activeAgentId: number | null; onSelectAgent: (id: number) => void;
}
export default function ChatInput(props: Props) {
  const [input, setInput] = useState("");
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const match = input.match(/(?:^|\s)([@/])([^\s]*)$/);
  const showing = !!match && dismissed !== input;
  const sources = match?.[1] === "@";
  const filter = match?.[2]?.toLowerCase() || "";
  const items = sources
    ? props.availableSources.filter(s => !props.selectedSources.includes(s) && s.toLowerCase().includes(filter)).map(s => ({ id: s, name: s }))
    : props.availableAgents.filter(a => a.id !== props.activeAgentId && a.name.toLowerCase().includes(filter)).map(a => ({ id: String(a.id), name: a.name }));
  const selected = items.length ? Math.min(index, items.length - 1) : 0;
  useEffect(() => { if (!props.isLoading) inputRef.current?.focus(); }, [props.isLoading]);

  function choose(item: { id: string; name: string }) {
    if (sources) props.onAddSource(item.id); else props.onSelectAgent(Number(item.id));
    setInput(input.replace(/(?:^|\s)[@/][^\s]*$/, " ").trimStart());
    setIndex(0); setDismissed(null); inputRef.current?.focus();
  }
  return <div className="relative mt-3">
    {showing && <div id="chat-suggestions" role="listbox" className="absolute bottom-full mb-2 w-full max-h-52 overflow-auto rounded-xl border bg-white dark:bg-neutral-900 shadow-lg p-2">
      {items.length ? items.map((item, i) => <button key={item.id} role="option" aria-selected={i === selected} onClick={() => choose(item)} className={"flex items-center gap-2 w-full rounded-lg p-2 text-left text-sm " + (i === selected ? "bg-indigo-50 dark:bg-indigo-950" : "")}>{sources ? <FileText className="h-4 w-4" /> : <Bot className="h-4 w-4" />}{item.name}</button>) : <p className="p-2 text-sm text-neutral-500">No matches.</p>}
    </div>}
    <form onSubmit={event => { event.preventDefault(); if (!showing && input.trim() && !props.isLoading) { props.onSend(input.trim()); setInput(""); } }} className="flex gap-2">
      <input ref={inputRef} value={input} aria-label="Message" role="combobox" aria-expanded={showing} aria-controls="chat-suggestions"
        onChange={e => { setInput(e.target.value); setIndex(0); setDismissed(null); }}
        onKeyDown={e => {
          if (!showing) return;
          if (e.key === "Escape") { setDismissed(input); e.preventDefault(); }
          if (!items.length) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setIndex((selected + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length); }
          if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); choose(items[selected]); }
        }}
        placeholder="Ask about your sources? (@ source, / agent)" disabled={props.isLoading}
        className="min-w-0 flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent px-4 py-3 text-sm focus:outline-indigo-500" />
      <button aria-label="Send message" disabled={props.isLoading || !input.trim()} className="rounded-xl bg-indigo-600 px-4 text-white disabled:opacity-40"><Send className="h-4 w-4" /></button>
    </form>
  </div>;
}
