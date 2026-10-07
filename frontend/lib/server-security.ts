import { NextRequest } from "next/server";

export const backendURL = process.env.SYNAPSE_BACKEND_URL || "http://127.0.0.1:8000";

export function trustedRequest(request: NextRequest, mutation = false): boolean {
  const host = request.headers.get("host") || "";
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return false;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return false;
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site") return false;
  return !mutation || origin === new URL(request.url).origin;
}

export function validBackendURL() {
  const url = new URL(backendURL);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.username || url.password || url.pathname !== "/") {
    throw new Error("SYNAPSE_BACKEND_URL must be a loopback HTTP address.");
  }
  return url.origin;
}
