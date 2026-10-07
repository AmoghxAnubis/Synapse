import axios from "axios";
import { redirect } from "next/navigation";

const api = axios.create({ baseURL: "/api/backend", timeout: 150000 });
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && typeof window !== "undefined") redirect("/sign-in");
  return Promise.reject(error);
});

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map(d => d.msg).join("; ");
    return error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export interface HealthResponse {
  status: string; memory_engine: string; generation_engine: string; orchestrator: string;
  agents_active: string[]; network_enabled: boolean;
  llm: { ready: boolean; model: string; models: string[]; error: string | null };
}
export interface UploadResponse { status: string; filename: string; chunks_processed: number; hardware: string; unchanged?: boolean }
export interface Citation { id: string; source: string; page: number; chunk: number; url: string; text: string; distance: number }
export interface AskResponse { answer: string; sources: string[]; citations: Citation[]; hardware_flow: string; capabilities_used?: string[] }
export interface ModeResponse { status: string; orchestrator_response: { status: string; current_mode: string }; hardware_used: string }
export interface Source { name: string; chunks: number; url?: string; platform?: string }
export interface Agent {
  id: number; name: string; description: string; icon: string; system_instruction: string;
  capabilities: { web_search: boolean; terminal: boolean }; linked_sources: string[]; integrations: string[];
}
export type Platform = "github" | "slack" | "notion" | "jira" | "discord";
export interface IntegrationStatusEntry { connected: boolean; last_synced: string | null; resources?: string[]; server?: string; email?: string }
export interface SyncResponse { status: string; platform: string; documents_ingested: number; chunks_created: number; hardware: string; documents_changed: number }
export interface Job<T> { id: string; status: "queued" | "running" | "completed" | "failed" | "cancelled"; result?: T; error?: string }
export interface Conversation { id: string; title: string; updated: number }
export interface SavedMessage { id: string; role: "user" | "ai"; content: string; citations: Citation[]; created: number }
export interface LocalSettings { ollama_url: string; model: string; network_enabled: boolean; retrieval_max_distance: number; llm?: HealthResponse["llm"] }
export interface MeetingsData { notes: string; tasks: { id: number; text: string; completed: boolean }[] }
export interface ActionPreview { id: string; action: string; description: string; expires: number }

export async function checkHealth(): Promise<HealthResponse> { return (await api.get("/")).data; }
export async function waitForJob<T>(id: string, signal?: AbortSignal): Promise<T> {
  try {
    for (;;) {
      if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
      const job: Job<T> = (await api.get("/jobs/" + id, { signal })).data;
      if (job.status === "completed" && job.result) return job.result;
      if (job.status === "failed") throw new Error(job.error || "Import failed.");
      if (job.status === "cancelled") throw new Error("Import cancelled.");
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  } finally {
    if (signal?.aborted) await api.delete("/jobs/" + id).catch(() => {});
  }
}
export async function uploadDocument(file: File, signal?: AbortSignal): Promise<UploadResponse> {
  const form = new FormData(); form.append("file", file);
  const job = (await api.post("/ingestion/jobs", form, { signal })).data;
  return waitForJob<UploadResponse>(job.id, signal);
}
export async function askSynapse(text: string, selectedSources: string[] = [], agentId: number | null = null): Promise<AskResponse> {
  return (await api.post("/ask", { text, selected_sources: selectedSources, agent_id: agentId })).data;
}
export async function streamAnswer(
  text: string, selectedSources: string[], agentId: number | null, conversationId: string,
  allowWeb: boolean, signal: AbortSignal,
  onEvent: (event: { type: string; text?: string; citations?: Citation[]; detail?: string }) => void,
) {
  const response = await fetch("/api/backend/ask/stream", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, selected_sources: selectedSources, agent_id: agentId, conversation_id: conversationId, allow_web: allowWeb }), signal });
  if (response.status === 401) { redirect("/sign-in"); throw new Error("Session expired."); }
  if (!response.ok) { const data = await response.json(); throw new Error(data.detail || "Answer failed."); }
  if (!response.body) throw new Error("Streaming is unavailable.");
  const reader = response.body.getReader(); const decoder = new TextDecoder();
  let buffer = ""; let completed = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n"); buffer = events.pop() || "";
      for (const block of events) {
        if (!block.startsWith("data: ")) continue;
        const event = JSON.parse(block.slice(6));
        if (event.type === "error") throw new Error(event.detail);
        if (event.type === "done") completed = true;
        onEvent(event);
      }
    }
    if (!completed) throw new Error("Answer interrupted. Please try again.");
  } finally { await reader.cancel(); reader.releaseLock(); }
}
export async function fetchAgents(): Promise<Agent[]> { return (await api.get("/agents")).data; }
export async function createAgent(data: Omit<Agent, "id">): Promise<Agent> { return (await api.post("/agents", data)).data; }
export async function updateAgent(id: number, updates: Partial<Agent>): Promise<Agent> { return (await api.patch("/agents/" + id, updates)).data; }
export async function deleteAgent(id: number) { return (await api.delete("/agents/" + id)).data; }
export async function setOrchestratorMode(mode: string): Promise<ModeResponse> { return (await api.post("/set_mode", { mode })).data; }
export async function fetchSources(): Promise<Source[]> { return (await api.get("/sources")).data; }
export async function fetchSource(name: string): Promise<(Citation & { platform: string })[]> { return (await api.get("/source", { params: { name } })).data; }
export async function deleteSource(name: string) { await api.delete("/source", { params: { name } }); }
export async function saveIntegrationKey(platform: Platform, key: string, resources: string[], server = "", email = "") {
  return (await api.post("/integrations/" + platform + "/connect", { key, resources, server, email })).data;
}
export async function disconnectIntegration(platform: Platform) { await api.delete("/integrations/" + platform); }
export async function triggerSync(platform: Platform): Promise<SyncResponse> {
  const job = (await api.post("/integrations/" + platform + "/sync")).data;
  return waitForJob<SyncResponse>(job.id);
}
export async function fetchIntegrationStatuses(): Promise<Record<Platform, IntegrationStatusEntry>> { return (await api.get("/integrations/status")).data; }
export async function ingestURL(url: string): Promise<{ chunks_processed: number }> {
  const job = (await api.post("/ingest/url", { url })).data;
  return waitForJob<{ chunks_processed: number }>(job.id);
}
export async function fetchMeetings(): Promise<MeetingsData> { return (await api.get("/meetings")).data; }
export async function saveMeetings(data: MeetingsData) { return (await api.post("/meetings", data)).data; }
export async function getSettings(): Promise<LocalSettings> { return (await api.get("/settings")).data; }
export async function saveSettings(settings: LocalSettings) { const { llm: _llm, ...data } = settings; void _llm; return (await api.put("/settings", data)).data; }
export async function fetchConversations(): Promise<Conversation[]> { return (await api.get("/conversations")).data; }
export async function newConversation(): Promise<Conversation> { return (await api.post("/conversations")).data; }
export async function fetchConversation(id: string): Promise<SavedMessage[]> { return (await api.get("/conversations/" + id)).data; }
export async function deleteConversation(id: string) { await api.delete("/conversations/" + id); }
export async function previewAction(action: string, params: Record<string, string>, agentId: number): Promise<ActionPreview> { return (await api.post("/actions/preview", { action, params, agent_id: agentId })).data; }
export async function approveAction(id: string): Promise<{ message: string; url?: string }> { return (await api.post("/actions/" + id + "/approve")).data; }
export async function cancelAction(id: string) { await api.delete("/actions/" + id); }
export async function runTerminal(command: string, agentId: number) { return (await api.post("/tools/terminal", { command, agent_id: agentId })).data; }
export async function fetchAudit(): Promise<{ id: number; action: string; outcome: string; created: number }[]> { return (await api.get("/audit")).data; }
