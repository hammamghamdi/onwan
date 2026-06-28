import { requireAdminCsrf } from "@/lib/adminApi";
import { adminSessionCookieName } from "@/lib/adminSession";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const csrfError = requireAdminCsrf(request);
  if (csrfError) return csrfError;

  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: adminSessionCookieName,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
