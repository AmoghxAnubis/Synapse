"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { errorMessage } from "@/lib/api";

interface Props {
  open: boolean; onOpenChange: (open: boolean) => void; platformName: string;
  platformIcon: React.ReactNode; onSubmit: (key: string, resources: string[], server: string, email: string) => Promise<void>;
}
export default function ConnectModal(props: Props) {
  const [key, setKey] = useState(""); const [resources, setResources] = useState("");
  const [server, setServer] = useState(""); const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const hint = props.platformName === "GitHub" ? "owner/repository" : props.platformName === "Notion" ? "Page IDs shared with the integration" : props.platformName === "Jira" ? "Project keys, e.g. PROJ" : "Channel IDs";
  const inputClass = "w-full rounded-lg border bg-transparent p-3 text-sm mt-1";
  return <Dialog open={props.open} onOpenChange={open => { if (!busy) { props.onOpenChange(open); if (!open) { setKey(""); setError(""); } } }}>
    <DialogContent className="bg-white dark:bg-neutral-900">
      <DialogTitle>Connect {props.platformName}</DialogTitle>
      <DialogDescription>Only the sources you select will be imported. Credentials are saved in your OS credential store.</DialogDescription>
      <form className="space-y-4" onSubmit={async e => {
        e.preventDefault(); setBusy(true); setError("");
        try { await props.onSubmit(key.trim(), resources.split(/[\n,]/).map(s => s.trim()).filter(Boolean), server.trim(), email.trim()); setKey(""); props.onOpenChange(false); }
        catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
      }}>
        <label className="block text-sm">API token<input aria-label="API token" type="password" autoComplete="off" required value={key} onChange={e => setKey(e.target.value)} className={inputClass} /></label>
        <label className="block text-sm">Selected sources<textarea required placeholder={hint + " (one per line)"} value={resources} onChange={e => setResources(e.target.value)} className={inputClass} /></label>
        {props.platformName === "Jira" && <><label className="block text-sm">Jira Cloud URL<input type="url" required placeholder="https://workspace.atlassian.net" value={server} onChange={e => setServer(e.target.value)} className={inputClass} /></label><label className="block text-sm">Account email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} /></label></>}
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-indigo-600 p-3 text-white disabled:opacity-50">{busy ? "Validating connection?" : "Validate and connect"}</button>
      </form>
    </DialogContent>
  </Dialog>;
}
