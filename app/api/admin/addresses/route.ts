import { requireAdmin } from "@/lib/adminApi";
import { normalizeUsername } from "@/lib/username";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { supabase, error } = await requireAdmin(request);

  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const search = normalizeUsername(searchParams.get("username") || "");
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("page_size") || "25"))
  );

  const { data, error: monitorError } = await supabase.rpc(
    "admin_address_monitor",
    {
      p_search_username: search,
      p_search_city: "",
      p_sort: "created_desc",
      p_page: page,
      p_page_size: pageSize,
    }
  );

  if (monitorError) {
    console.error("Admin addresses failed", monitorError);
    return NextResponse.json({ message: "Unable to load addresses" }, { status: 500 });
  }

  return NextResponse.json(data || { total: 0, page, page_size: pageSize, rows: [] });
}

export async function PATCH(request: NextRequest) {
  const { supabase, error } = await requireAdmin(request);

  if (error) return error;

  const body = (await request.json()) as {
    username?: string;
    suspend?: boolean;
    reason?: string;
  };
  const username = normalizeUsername(body.username || "");

  if (!username) {
    return NextResponse.json({ message: "Missing username" }, { status: 400 });
  }

  const update = body.suspend
    ? {
        is_suspended: true,
        suspended_reason: body.reason?.trim() || "Admin suspension",
        suspended_at: new Date().toISOString(),
      }
    : {
        is_suspended: false,
        suspended_reason: null,
        suspended_at: null,
      };

  const { error: updateError } = await supabase
    .from("profiles")
    .update(update)
    .ilike("username", username);

  if (updateError) {
    console.error("Admin address update failed", updateError);
    return NextResponse.json({ message: "Unable to update address" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
