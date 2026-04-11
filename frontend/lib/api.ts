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
}

// ── API Functions ───────────────────────────────────────

/**
 * Ping the backend health endpoint.
 */
export async function checkHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>("/");
  return data;
}

/**
 * Upload a document file (PDF/TXT) to Vector Memory.
 */
export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<UploadResponse>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * Send a query to the RAG pipeline.
 */
export async function askSynapse(query: string, selectedSources: string[] = [], agentId: number | null = null): Promise<AskResponse> {
  const { data } = await api.post<AskResponse>("/ask", { 
    text: query,
    selected_sources: selectedSources,
    agent_id: agentId
  });
  return data;
}

/**
 * Fetch all available specialized agents/personas.
 */
export async function fetchAgents(): Promise<Agent[]> {
  const { data } = await api.get<Agent[]>("/agents");
  return data;
}

/**
 * Create a new custom agent.
 */
export async function createAgent(agentData: Omit<Agent, 'id'>): Promise<Agent> {
  const { data } = await api.post<Agent>("/agents", agentData);
  return data;
}

/**
 * Delete a custom agent.
 */
export async function deleteAgent(agentId: number): Promise<{ status: string }> {
  const { data } = await api.delete<{ status: string }>(`/agents/${agentId}`);
  return data;
}

/**
 * Set the orchestrator mode (FOCUS / MEETING / RESEARCH).
 */
export async function setOrchestratorMode(
  mode: string
): Promise<ModeResponse> {
  const { data } = await api.post<ModeResponse>("/set_mode", { mode });
  return data;
}

/**
 * Fetch all unique sources from memory.
 */
export async function fetchSources(): Promise<Source[]> {
  const { data } = await api.get<Source[]>("/sources");
  return data;
}

/**
 * Delete a specific source from memory.
 */
export async function deleteSource(sourceName: string): Promise<void> {
  await api.delete(`/sources/${encodeURIComponent(sourceName)}`);
}

// ── Integration Types ──────────────────────────────────

export type Platform = "github" | "slack" | "notion" | "jira";

export interface IntegrationAuthResponse {
  status: string;
  platform: string;
  connected: boolean;
}

export interface SyncResponse {
  status: string;
  platform: string;
  documents_ingested: number;
  chunks_created: number;
  hardware: string;
}

export interface IntegrationStatusEntry {
  platform: Platform;
  connected: boolean;
  lastSynced: string | null;
}

// ── Mock Integration API (frontend-only) ───────────────

const STORAGE_KEY = "synapse_integrations";

function getStoredKeys(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

/**
 * Save an API key for a platform (stored locally).
 */
export async function saveIntegrationKey(
  platform: Platform,
  key: string
): Promise<IntegrationAuthResponse> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 1200));

  const stored = getStoredKeys();
  stored[platform] = key;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

  return {
    status: "success",
    platform,
    connected: true,
  };
}

/**
 * Trigger a sync for a platform (mock — generates fake results).
 */
export async function triggerSync(
  platform: Platform
): Promise<SyncResponse> {
  // Simulate longer sync
  await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1500));

  const docs = Math.floor(Math.random() * 20) + 3;
  const chunks = docs * (Math.floor(Math.random() * 5) + 2);

  return {
    status: "success",
    platform,
    documents_ingested: docs,
    chunks_created: chunks,
    hardware: "NPU",
  };
}

/**
 * Get connection statuses for all platforms.
 */
export function getIntegrationStatuses(): IntegrationStatusEntry[] {
  const stored = getStoredKeys();
  const platforms: Platform[] = ["github", "slack", "notion", "jira"];

  return platforms.map((p) => ({
    platform: p,
    connected: !!stored[p],
    lastSynced: stored[p] ? "Just now" : null,
  }));
}
