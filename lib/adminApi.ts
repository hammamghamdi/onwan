import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  adminSessionCookieName,
  verifyAdminCsrfToken,
  verifyAdminSessionToken,
} from "@/lib/adminSession";

export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

export const requireAdmin = async (request: NextRequest) => {
  const session = request.cookies.get(adminSessionCookieName)?.value;

  if (!verifyAdminSessionToken(session)) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const supabase = getSupabaseAdmin();

  return { supabase };
};

export const requireAdminWrite = async (request: NextRequest) => {
  const session = request.cookies.get(adminSessionCookieName)?.value;

  if (!verifyAdminSessionToken(session)) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const csrfToken = request.headers.get("x-csrf-token");

  if (!verifyAdminCsrfToken(session, csrfToken)) {
    return {
      error: NextResponse.json({ message: "Invalid CSRF token" }, { status: 403 }),
    };
  }

  const supabase = getSupabaseAdmin();

  return { supabase };
};

export const requireAdminCsrf = (request: NextRequest) => {
  const session = request.cookies.get(adminSessionCookieName)?.value;
  const csrfToken = request.headers.get("x-csrf-token");

  if (!verifyAdminSessionToken(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!verifyAdminCsrfToken(session, csrfToken)) {
    return NextResponse.json({ message: "Invalid CSRF token" }, { status: 403 });
  }

  return null;
};
