import { requireAdmin, requireAdminWrite } from "@/lib/adminApi";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const reportStatuses = ["new", "reviewed", "ignored", "action_taken"];

export async function GET(request: NextRequest) {
  const { supabase, error } = await requireAdmin(request);

  if (error) return error;

  const status = request.nextUrl.searchParams.get("status") || "";

  let query = supabase
    .from("abuse_reports")
    .select("id, reported_username, reported_url, reason, details, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && reportStatuses.includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error: reportsError } = await query;

  if (reportsError) {
    console.error("Admin reports failed", reportsError);
    return NextResponse.json({ message: "Unable to load reports" }, { status: 500 });
  }

  return NextResponse.json({ reports: data || [] });
}

export async function PATCH(request: NextRequest) {
  const { supabase, error } = await requireAdminWrite(request);

  if (error) return error;

  const body = (await request.json()) as {
    id?: string;
    status?: string;
  };

  if (!body.id || !body.status || !reportStatuses.includes(body.status)) {
    return NextResponse.json({ message: "Invalid report update" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("abuse_reports")
    .update({ status: body.status })
    .eq("id", body.id);

  if (updateError) {
    console.error("Admin report update failed", updateError);
    return NextResponse.json({ message: "Unable to update report" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
