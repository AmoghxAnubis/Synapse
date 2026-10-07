"use client";
import { useState, useEffect, useRef } from "react";
import { fetchMeetings, saveMeetings, errorMessage, type MeetingsData } from "@/lib/api";
import { toast } from "sonner";

export default function MeetingsPage() {
  const [data, setData] = useState<MeetingsData>({ notes: "", tasks: [] });
  const [task, setTask] = useState(""); const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false); const generation = useRef(0);
  useEffect(() => { fetchMeetings().then(value => { setData(value); setReady(true); }).catch(e => setError(errorMessage(e))); }, []);
  function update(value: MeetingsData) { setData(value); setDirty(true); generation.current += 1; }
  async function save() {
    if (busy || !ready) return;
    const version = generation.current; setBusy(true); setError("");
    try { await saveMeetings(data); if (version === generation.current) setDirty(false); toast.success("Meeting notes saved locally."); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <section className="max-w-5xl mx-auto space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Meeting notes</h1><p className="mt-2 text-sm text-neutral-500">Keep notes and tasks on this computer. Save before leaving this page.</p></div>
      <button disabled={!ready || busy || !dirty} onClick={save} className="rounded-lg bg-indigo-600 text-white px-4 py-2 disabled:opacity-50">{busy ? "Saving?" : dirty ? "Save notes" : "Saved"}</button></header>
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    {!ready && <p className="text-sm text-neutral-500">Notes must load before editing to protect existing data.</p>}
    <div className="grid md:grid-cols-2 gap-6">
      <label className="block text-sm font-medium">Notes or transcript<textarea disabled={!ready} value={data.notes} onChange={e => update({ ...data, notes: e.target.value })} placeholder="Write notes or paste a transcript?" className="mt-3 w-full min-h-80 rounded-xl border p-5 bg-transparent font-normal leading-relaxed" /></label>
      <section className="rounded-xl border p-5 space-y-4"><h2 className="font-medium">Action items</h2>
        <form onSubmit={e => { e.preventDefault(); if (task.trim()) { update({ ...data, tasks: [...data.tasks, { id: Date.now(), text: task.trim(), completed: false }] }); setTask(""); } }} className="flex gap-2">
          <input aria-label="New task" disabled={!ready} value={task} onChange={e => setTask(e.target.value)} className="min-w-0 flex-1 rounded-lg border p-2 text-sm bg-transparent" placeholder="Add a task?" />
          <button disabled={!ready} className="rounded-lg border px-3 text-sm">Add</button></form>
        <ul className="space-y-3">{data.tasks.map(t => <li key={t.id} className="flex gap-2 text-sm">
          <input aria-label={"Complete " + t.text} type="checkbox" checked={t.completed} onChange={() => update({ ...data, tasks: data.tasks.map(item => item.id === t.id ? { ...item, completed: !item.completed } : item) })} />
          <span className={"flex-1 " + (t.completed ? "line-through text-neutral-400" : "")}>{t.text}</span>
          <button aria-label={"Delete " + t.text} onClick={() => update({ ...data, tasks: data.tasks.filter(item => item.id !== t.id) })}>?</button>
        </li>)}</ul>
      </section>
    </div>
    <p className="text-xs text-neutral-500">This workspace supports manual notes and pasted transcripts. Audio recording and transcription are not available yet.</p>
  </section>;
}
