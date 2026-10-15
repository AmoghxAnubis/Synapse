"use client";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { checkReadiness, getSettings, saveSettings, errorMessage, type LocalSettings } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [settings, setSettings] = useState<LocalSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  useEffect(() => {
    let active = true;
    getSettings().then(value => { if (active) setSettings(value); })
      .catch(e => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function checkSetup() {
    setChecking(true); setError("");
    try {
      const result = await checkReadiness();
      // Diagnose saved settings without discarding any unsaved form edits.
      setSettings(current => current ? { ...current, llm: result.llm, embeddings: result.embeddings } : current);
    } catch (e) { setError(errorMessage(e)); }
    finally { setChecking(false); }
  }

  const llm = settings?.llm;
  const embeddings = settings?.embeddings;
  const unsavedModel = !!llm && (settings?.model !== llm.model || (!!llm.base_url && settings?.ollama_url !== llm.base_url));
  const field = "block w-full mt-2 rounded-lg border bg-transparent p-3 text-sm";
  const provisionPrefix = embeddings ? "$env:SYNAPSE_EMBEDDING_DIR = '" + embeddings.directory.replace(/'/g, "''") + "'\n" : "";

  return <section className="max-w-3xl mx-auto space-y-6">
    <header><h1 className="text-2xl font-semibold">Settings</h1><p className="mt-2 text-sm text-neutral-500">Control local inference and where Synapse can connect.</p></header>
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    {loading && <p role="status">Loading settings...</p>}
    {!loading && !settings && <button className="rounded-lg border px-4 py-2 text-sm" onClick={async () => {
      setLoading(true); setError("");
      try { setSettings(await getSettings()); } catch (e) { setError(errorMessage(e)); }
      finally { setLoading(false); }
    }}>Retry loading settings</button>}
    <div className="rounded-xl border p-6 flex items-center justify-between"><span>Appearance</span><ThemeToggle /></div>
    {settings && <>
      <section aria-label="Local model setup" className="rounded-xl border p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Local model setup</h2>
          <button type="button" disabled={checking || busy} onClick={checkSetup} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">
            {checking ? "Checking setup..." : "Check setup"}
          </button>
        </div>
        <p className="text-sm text-neutral-500">Checks use your saved settings and load the document model locally. They do not download models or change your settings.</p>
        <div role="status" aria-live="polite" className="space-y-4 text-sm">
          <div><h3 className="font-medium">Answers: {llm?.ready ? "Model installed" : "Setup needed"}</h3>
            <p className="mt-1 break-all text-neutral-500">Saved model: {llm?.model || settings.model}</p>
            <p className="mt-1 text-neutral-500">{llm?.ready ? "Ollama lists this model. Answer quality and performance depend on the model and your computer." : llm?.error || "Start Ollama and check setup."}</p>
            {llm?.model_digest && <details className="mt-2"><summary className="cursor-pointer">Model identity</summary><p className="mt-2 break-all font-mono text-xs">{llm.resolved_model}<br />{llm.model_digest}</p></details>}
          </div>
          <div><h3 className="font-medium">Document memory: {embeddings?.ready ? "Ready on " + embeddings.hardware : embeddings?.state === "not_loaded" ? "Files found; check setup" : "Setup needed"}</h3>
            <p className="mt-1 text-neutral-500">{embeddings?.ready ? "The document model loaded successfully. You can import documents and search their content." : embeddings?.error || "Check setup to verify the local document model, including its tokenizer and runtime."}</p>
            {embeddings && <p className="mt-1 break-all text-xs text-neutral-500">Model folder: {embeddings.directory}</p>}
          </div>
        </div>
        <p className="text-xs text-neutral-500">Saved conversations and source viewing/deletion remain available when a model is missing. Imports and evidence retrieval need the document model; answers also need Ollama.</p>
        <details className="text-sm"><summary className="cursor-pointer font-medium">Model setup instructions</summary>
          <div className="mt-3 space-y-4 text-neutral-500">
            <div><p>Start Ollama, then install a model explicitly if needed. Our current beta quality evaluation uses llama3; other models need their own quality checks.</p>
              <pre className="mt-2 overflow-x-auto rounded-lg border p-3 text-xs"><code>ollama pull llama3</code></pre>
              <p className="mt-2">Choose the installed model below, save settings, then check setup. Model downloads require an internet connection.</p>
            </div>
            <div><p>To install the document model, open PowerShell in your Synapse installation&apos;s backend folder. Use the command for your installation type; the model folder below matches this running backend.</p>
              <p className="mt-2 font-medium">Windows installer</p>
              <pre className="mt-2 overflow-x-auto rounded-lg border p-3 text-xs"><code>{provisionPrefix + ".\\runtime\\python.exe -m app.provision"}</code></pre>
              <p className="mt-2 font-medium">Developer checkout</p>
              <pre className="mt-2 overflow-x-auto rounded-lg border p-3 text-xs"><code>{provisionPrefix + ".\\venv\\Scripts\\python.exe -m app.provision"}</code></pre>
              <p className="mt-2">This is an explicit download. When it finishes, check setup again. Ordinary startup and setup checks do not download anything.</p>
            </div>
          </div>
        </details>
      </section>
      <form className="space-y-6" onSubmit={async e => {
        e.preventDefault(); setBusy(true); setError("");
        try { await saveSettings(settings); setSettings(await getSettings()); toast.success("Settings saved."); }
        catch (e) { setError(errorMessage(e)); }
        finally { setBusy(false); }
      }}>
        <fieldset disabled={busy || checking} className="rounded-xl border p-6 space-y-5 disabled:opacity-60"><legend className="px-1 font-semibold">Local model</legend>
          <label className="block text-sm">Ollama address<input type="url" required value={settings.ollama_url} onChange={e => setSettings({ ...settings, ollama_url: e.target.value })} className={field} /></label>
          <label className="block text-sm">Model<input required list="ollama-models" value={settings.model} onChange={e => setSettings({ ...settings, model: e.target.value })} className={field} /><datalist id="ollama-models">{llm?.models.map(m => <option key={m} value={m} />)}</datalist></label>
          {unsavedModel && <p className="text-sm text-amber-600">Save your model or address changes before checking them. The setup result above describes the saved configuration.</p>}
        </fieldset>
        <fieldset disabled={busy || checking} className="rounded-xl border p-6 space-y-4 disabled:opacity-60"><legend className="px-1 font-semibold">Network access</legend>
          <label className="flex gap-3 text-sm"><input type="checkbox" checked={settings.network_enabled} onChange={e => setSettings({ ...settings, network_enabled: e.target.checked })} />Enable connected features</label>
          <p className="text-sm text-neutral-500">When off, integrations, URL imports, external writes, and web search are blocked. Document processing and inference stay local. Web search additionally requires consent for each chat request.</p>
          <p className="text-xs text-neutral-500">Embedding models must be provisioned once before offline use. Local data is stored on this computer; protect your OS account and backups.</p>
        </fieldset>
        <button disabled={busy || checking} className="rounded-lg bg-indigo-600 px-5 py-3 text-white disabled:opacity-50">{busy ? "Saving..." : "Save settings"}</button>
      </form>
    </>}
    <button className="text-sm text-neutral-500 underline" onClick={async () => {
      const response = await fetch("/api/session", { method: "DELETE" });
      if (response.ok) { router.replace("/sign-in"); router.refresh(); }
      else toast.error("Could not end the session.");
    }}>Disconnect this browser</button>
  </section>;
}
