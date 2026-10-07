"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brain, LockKeyhole } from "lucide-react";

export default function SignInPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function pair(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);
      setToken(""); router.push("/dashboard"); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Pairing failed."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen grid place-items-center bg-neutral-50 dark:bg-neutral-950 p-6">
    <section className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm">
      <Brain className="h-9 w-9 text-indigo-500 mb-6" />
      <h1 className="text-2xl font-semibold">Your local workspace</h1>
      <p className="mt-3 text-sm text-neutral-500">Pair this browser with Synapse on your computer. No cloud account is needed.</p>
      <form onSubmit={pair} className="mt-6 space-y-4">
        <label className="block text-sm font-medium" htmlFor="pairing-token">Local pairing token</label>
        <input id="pairing-token" type="password" autoComplete="off" required value={token} onChange={e => setToken(e.target.value)} className="w-full rounded-lg border p-3 bg-transparent" />
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-indigo-600 text-white p-3 disabled:opacity-50">{busy ? "Connecting?" : "Connect to Synapse"}</button>
      </form>
      <p className="mt-5 text-xs text-neutral-500 flex gap-2"><LockKeyhole className="h-4 w-4 shrink-0" />Start the backend and copy the token from backend/.synapse/api-token. The browser session expires after one day.</p>
      <Link href="/" className="mt-6 inline-block text-sm text-indigo-500">Back to home</Link>
    </section>
  </main>;
}
