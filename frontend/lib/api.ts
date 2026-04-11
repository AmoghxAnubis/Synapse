import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Response Types ──────────────────────────────────────

export interface HealthResponse {
  status: string;
  memory_engine: string;
  generation_engine: string;
  orchestrator: string;
  agents_active: string[];
}

export interface UploadResponse {
  status: string;
  filename: string;
  chunks_processed: number;
  hardware: string;
}

export interface AskResponse {
  answer: string;
  sources: string[];
  hardware_flow: string;
  capabilities_used?: string[];
}

export interface ModeResponse {
  status: string;
  orchestrator_response: {
    status: string;
    current_mode: string;
  };
  hardware_used: string;
}

export interface Source {
  name: string;
  chunks: number;
}

export interface Agent {
  id: number;
  name: string;
  description: string;
  icon: string;
  system_instruction: string;
  capabilities: { web_search: boolean; terminal: boolean };
  linked_sources: string[];
  integrations: string[];
}

// ── API Functions ───────────────────────────────────────

export async function checkHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>("/");
  return data;
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<UploadResponse>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function askSynapse(query: string, selectedSources: string[] = [], agentId: number | null = null): Promise<AskResponse> {
  const { data } = await api.post<AskResponse>("/ask", { 
    text: query,
    selected_sources: selectedSources,
    agent_id: agentId
  });
  return data;
}

export async function fetchAgents(): Promise<Agent[]> {
  const { data } = await api.get<Agent[]>("/agents");
  return data;
}

export async function createAgent(agentData: Omit<Agent, 'id'>): Promise<Agent> {
  const { data } = await api.post<Agent>("/agents", agentData);
  return data;
}

export async function updateAgent(agentId: number, updates: Partial<Agent>): Promise<Agent> {
  const { data } = await api.patch<Agent>(`/agents/${agentId}`, updates);
  return data;
}

export async function deleteAgent(agentId: number): Promise<{ status: string }> {
  const { data } = await api.delete<{ status: string }>(`/agents/${agentId}`);
  return data;
}

export async function setOrchestratorMode(mode: string): Promise<ModeResponse> {
  const { data } = await api.post<ModeResponse>("/set_mode", { mode });
  return data;
}

export async function fetchSources(): Promise<Source[]> {
  const { data } = await api.get<Source[]>("/sources");
  return data;
}

export async function deleteSource(sourceName: string): Promise<void> {
  await api.delete(`/sources/${encodeURIComponent(sourceName)}`);
}

// ── Integration Types & Functions ──────────────────────

export type Platform = "github" | "slack" | "notion" | "jira" | "discord";

export interface SyncResponse {
  status: string;
  platform: string;
  documents_ingested: number;
  chunks_created: number;
  hardware: string;
}

export interface IntegrationStatusEntry {
  connected: boolean;
  last_synced: string | null;
}

export async function saveIntegrationKey(
  platform: Platform,
  key: string
): Promise<{ status: string; platform: string; connected: boolean }> {
  const { data } = await api.post(`/integrations/${platform}/connect`, { key });
  return data;
}

export async function triggerSync(platform: Platform): Promise<SyncResponse> {
  const { data } = await api.post<SyncResponse>(`/integrations/${platform}/sync`);
  return data;
}

export async function fetchIntegrationStatuses(): Promise<Record<Platform, IntegrationStatusEntry>> {
  const { data } = await api.get<Record<Platform, IntegrationStatusEntry>>("/integrations/status");
  return data;
}

// ── URL Ingestion ──────────────────────────────────────

export async function ingestURL(url: string): Promise<{ status: string; url: string; chunks_processed: number }> {
  const { data } = await api.post("/ingest/url", { url });
  return data;
}

// ── Web Search & Terminal Tools ────────────────────────

export async function webSearch(query: string): Promise<{ results: string }> {
  const { data } = await api.post("/tools/web-search", { query });
  return data;
}

export async function runTerminal(command: string): Promise<{ stdout: string; stderr: string; exit_code: number; blocked: boolean }> {
  const { data } = await api.post("/tools/terminal", { command });
  return data;
}

// ── Meetings Persistence ───────────────────────────────

export interface MeetingsData {
  notes: string;
  tasks: { id: number; text: string; completed: boolean }[];
}

export async function fetchMeetings(): Promise<MeetingsData> {
  const { data } = await api.get<MeetingsData>("/meetings");
  return data;
}

export async function saveMeetings(data: MeetingsData): Promise<{ status: string }> {
  const { data: resp } = await api.post<{ status: string }>("/meetings", data);
  return resp;
}
