"use client";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getSettings, saveSettings, errorMessage, type LocalSettings } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [settings, setSettings] = useState<LocalSettings | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const router = useRouter();
  useEffect(() => { getSettings().then(setSettings).catch(e => setError(errorMessage(e))); }, []);
  const field = "block w-full mt-2 rounded-lg border bg-transparent p-3 text-sm";
  return <section className="max-w-3xl mx-auto space-y-6">
    <header><h1 className="text-2xl font-semibold">Settings</h1><p className="mt-2 text-sm text-neutral-500">Control local inference and where Synapse can connect.</p></header>
    {error && <p role="alert" className="text-red-500 text-sm">{error}</p>}
    <div className="rounded-xl border p-6 flex items-center justify-between"><span>Appearance</span><ThemeToggle /></div>
    {settings && <form className="space-y-6" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(""); try { await saveSettings(settings); setSettings(await getSettings()); toast.success("Settings saved."); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }}>
      <div className="rounded-xl border p-6 space-y-5"><h2 className="font-semibold">Local model</h2>
        <label className="block text-sm">Ollama address<input type="url" required value={settings.ollama_url} onChange={e => setSettings({ ...settings, ollama_url: e.target.value })} className={field} /></label>
        <label className="block text-sm">Model<input required list="ollama-models" value={settings.model} onChange={e => setSettings({ ...settings, model: e.target.value })} className={field} /><datalist id="ollama-models">{settings.llm?.models.map(m => <option key={m} value={m} />)}</datalist></label>
        <p className="text-sm text-neutral-500" role="status">{settings.llm?.ready ? "Ollama is ready." : settings.llm?.error || "Check Ollama after saving."}</p>
      </div>
      <div className="rounded-xl border p-6 space-y-4"><h2 className="font-semibold">Network access</h2>
        <label className="flex gap-3 text-sm"><input type="checkbox" checked={settings.network_enabled} onChange={e => setSettings({ ...settings, network_enabled: e.target.checked })} />Enable connected features</label>
        <p className="text-sm text-neutral-500">When off, integrations, URL imports, external writes, and web search are blocked. Document processing and inference stay local. Web search additionally requires consent for each chat request.</p>
        <p className="text-xs text-neutral-500">Embedding models must be provisioned once before offline use. Local data is stored on this computer; protect your OS account and backups.</p>
      </div>
      <button disabled={busy} className="rounded-lg bg-indigo-600 px-5 py-3 text-white disabled:opacity-50">{busy ? "Saving?" : "Save settings"}</button>
    </form>}
    <button className="text-sm text-neutral-500 underline" onClick={async () => {
      const response = await fetch("/api/session", { method: "DELETE" });
      if (response.ok) { router.replace("/sign-in"); router.refresh(); }
      else toast.error("Could not end the session.");
    }}>Disconnect this browser</button>
  </section>;
}
