import { requireAdmin } from "@/lib/adminApi";
import { normalizeUsername } from "@/lib/username";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ProfileRow = {
  id: string;
  username: string;
  display_username: string | null;
  city: string | null;
  created_at: string | null;
  is_suspended: boolean | null;
  suspended_reason: string | null;
  suspended_at: string | null;
};

type VisitRow = {
  username: string;
  visitor_id: string | null;
  is_unique: boolean | null;
};

const getVisitStats = (visits: VisitRow[]) => {
  const stats = new Map<string, { total_visits: number; unique_visitors: number }>();
  const uniqueIds = new Map<string, Set<string>>();
  const uniqueFlags = new Map<string, number>();

  for (const visit of visits) {
    const username = normalizeUsername(visit.username);
    const current = stats.get(username) || { total_visits: 0, unique_visitors: 0 };

    current.total_visits += 1;
    stats.set(username, current);

    if (visit.visitor_id) {
      const ids = uniqueIds.get(username) || new Set<string>();
      ids.add(visit.visitor_id);
      uniqueIds.set(username, ids);
    }

    if (visit.is_unique) {
      uniqueFlags.set(username, (uniqueFlags.get(username) || 0) + 1);
    }
  }

  for (const [username, current] of stats) {
    current.unique_visitors = Math.max(
      uniqueIds.get(username)?.size || 0,
      uniqueFlags.get(username) || 0
    );
  }

  return stats;
};

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
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let profilesQuery = supabase
    .from("profiles")
    .select(
      "id, username, display_username, city, created_at, is_suspended, suspended_reason, suspended_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    profilesQuery = profilesQuery.ilike("username", `%${search}%`);
  }

  const [
    { data: profiles, error: profilesError, count },
    { data: visits, error: visitsError },
  ] = await Promise.all([
    profilesQuery.returns<ProfileRow[]>(),
    supabase
      .from("address_visits")
      .select("username, visitor_id, is_unique")
      .returns<VisitRow[]>(),
  ]);

  if (profilesError || visitsError) {
    console.error("Admin addresses failed", profilesError || visitsError);
    return NextResponse.json({ message: "Unable to load addresses" }, { status: 500 });
  }

  const visitStats = getVisitStats(visits || []);
  const rows = (profiles || []).map((profile) => ({
    ...profile,
    total_visits: visitStats.get(profile.username)?.total_visits || 0,
    unique_visitors: visitStats.get(profile.username)?.unique_visitors || 0,
  }));

  return NextResponse.json({
    total: count || 0,
    page,
    page_size: pageSize,
    rows,
  });
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
