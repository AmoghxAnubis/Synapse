import { NextRequest, NextResponse } from "next/server";
import { trustedRequest, validBackendURL, readLimitedBody } from "@/lib/server-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function forward(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  if (!trustedRequest(request, !["GET", "HEAD"].includes(request.method))) return NextResponse.json({ detail: "Local same-origin requests only." }, { status: 403 });
  const token = request.cookies.get("synapse-session")?.value;
  if (!token) return NextResponse.json({ detail: "Pair this browser with Synapse." }, { status: 401 });
  const { path = [] } = await context.params;
  if (path.some(p => !/^[a-zA-Z0-9_-]+$/.test(p))) return NextResponse.json({ detail: "Invalid API path." }, { status: 400 });
  const headers = new Headers({ Authorization: "Bearer " + token });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const size = Number(request.headers.get("content-length") || 0);
  if (size > 21 * 1024 * 1024) return NextResponse.json({ detail: "Request is too large." }, { status: 413 });
  try {
    const body = ["GET", "HEAD"].includes(request.method) ? undefined : await readLimitedBody(request, 21 * 1024 * 1024);
    if (body && body.byteLength > 21 * 1024 * 1024) return NextResponse.json({ detail: "Request is too large." }, { status: 413 });
    const response = await fetch(validBackendURL() + "/" + path.join("/") + new URL(request.url).search, {
      method: request.method, headers, body, cache: "no-store", signal: request.signal, redirect: "error",
    });
    return new Response(response.body, { status: response.status, headers: {
      "Content-Type": response.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if (error instanceof RangeError) return NextResponse.json({ detail: "Request is too large." }, { status: 413 });
    return NextResponse.json({ detail: "Local backend is unavailable. Start it and try again." }, { status: 503 });
  }
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
