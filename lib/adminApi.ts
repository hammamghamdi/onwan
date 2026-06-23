import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const getAdminEmails = () => {
  return (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

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
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const adminEmails = getAdminEmails();

  if (adminEmails.length === 0) {
    return {
      error: NextResponse.json(
        { message: "Admin access is not configured" },
        { status: 403 }
      ),
    };
  }

  const supabase = getSupabaseAdmin();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.email) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return {
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return { supabase };
};
