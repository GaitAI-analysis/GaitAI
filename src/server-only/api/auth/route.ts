import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie, getAdminPassword, setAuthCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  if (!body.password || body.password !== getAdminPassword()) {
    return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
  }
  setAuthCookie();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  clearAuthCookie();
  return NextResponse.json({ ok: true });
}
