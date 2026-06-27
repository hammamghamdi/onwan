import { getSupabaseAdmin } from "@/lib/adminApi";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const EXEMPT_ADMIN_EMAIL = "hammam.ghamdi@gmail.com";
const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;

const isAllowedRedirect = (redirectTo: string) => {
  try {
    const url = new URL(redirectTo);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (appUrl && url.origin === new URL(appUrl).origin) {
      return true;
    }

    return process.env.NODE_ENV !== "production" && localOriginPattern.test(url.origin);
  } catch {
    return false;
  }
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    email?: string;
    redirectTo?: string;
  };
  const email = body.email?.trim().toLowerCase();
  const redirectTo = body.redirectTo?.trim() || "";

  if (email !== EXEMPT_ADMIN_EMAIL || !isAllowedRedirect(redirectTo)) {
    return NextResponse.json({ message: "Invalid login request" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  // This bypasses only app-level client cooldown logic. Supabase/provider-level
  // OTP email rate limits are enforced by Supabase and cannot be bypassed from
  // the client or this route.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: false,
    },
  });

  if (error) {
    console.error("Admin login link failed", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
