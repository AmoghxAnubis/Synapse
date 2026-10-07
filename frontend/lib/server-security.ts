import { NextRequest } from "next/server";

export const backendURL = process.env.SYNAPSE_BACKEND_URL || "http://127.0.0.1:8000";

export function trustedRequest(request: NextRequest, mutation = false): boolean {
  const host = request.headers.get("host") || "";
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return false;
  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).protocol + "//" + host;
  if (origin && origin !== expectedOrigin) return false;
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site") return false;
  return !mutation || origin === expectedOrigin;
}

export function validBackendURL() {
  const url = new URL(backendURL);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.username || url.password || url.pathname !== "/") {
    throw new Error("SYNAPSE_BACKEND_URL must be a loopback HTTP address.");
  }
  return url.origin;
}

/** Stop reading as soon as the bound is exceeded, even without Content-Length. */
export async function readLimitedBody(request: NextRequest, limit: number): Promise<ArrayBuffer> {
  if (Number(request.headers.get("content-length") || 0) > limit) throw new RangeError("Request is too large.");
  if (!request.body) return new ArrayBuffer(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new RangeError("Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result.buffer;
}
