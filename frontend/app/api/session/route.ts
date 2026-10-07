import { NextRequest, NextResponse } from "next/server";
import { trustedRequest, validBackendURL, readLimitedBody } from "@/lib/server-security";

export const runtime = "nodejs";
const attempts: number[] = [];

export async function POST(request: NextRequest) {
  if (!trustedRequest(request, true)) return NextResponse.json({ detail: "Local same-origin requests only." }, { status: 403 });
  const now = Date.now();
  while (attempts.length && attempts[0] < now - 60_000) attempts.shift();
  if (attempts.length >= 10) return NextResponse.json({ detail: "Too many attempts. Wait a minute." }, { status: 429 });
  attempts.push(now);
  try {
    const body = JSON.parse(new TextDecoder().decode(await readLimitedBody(request, 1024)));
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (token.length < 32 || token.length > 200) return NextResponse.json({ detail: "Enter your local pairing token." }, { status: 400 });
    const backend = await fetch(validBackendURL() + "/", { headers: { Authorization: "Bearer " + token }, cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!backend.ok) return NextResponse.json({ detail: "Pairing token was not accepted." }, { status: 401 });
    const response = NextResponse.json({ paired: true });
    response.cookies.set("synapse-session", token, { httpOnly: true, sameSite: "strict", secure: new URL(request.url).protocol === "https:", path: "/", maxAge: 86400 });
    return response;
  } catch (error) {
    if (error instanceof RangeError) return NextResponse.json({ detail: "Pairing request is too large." }, { status: 413 });
    if (error instanceof SyntaxError) return NextResponse.json({ detail: "Invalid pairing request." }, { status: 400 });
    return NextResponse.json({ detail: "Start the local backend, then try pairing again." }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!trustedRequest(request, true)) return NextResponse.json({ detail: "Local same-origin requests only." }, { status: 403 });
  const response = NextResponse.json({ paired: false });
  response.cookies.delete("synapse-session");
  return response;
}
