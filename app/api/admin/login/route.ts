import {
  adminSessionCookieName,
  createAdminSessionToken,
  getConfiguredAdminIdentifier,
  verifyAdminPassword,
} from "@/lib/adminSession";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };
  const submittedUsername = body.username?.trim().toLowerCase() || "";
  const adminIdentifier = getConfiguredAdminIdentifier();

  if (
    !adminIdentifier ||
    submittedUsername !== adminIdentifier ||
    !verifyAdminPassword(body.password || "")
  ) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: adminSessionCookieName,
    value: createAdminSessionToken(adminIdentifier),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });

  return response;
}
