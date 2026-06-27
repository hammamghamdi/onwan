import { requireAdmin } from "@/lib/adminApi";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);

  if (error) return error;

  return NextResponse.json({ ok: true });
}
