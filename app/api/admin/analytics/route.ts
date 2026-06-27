import { requireAdmin } from "@/lib/adminApi";
import { normalizeUsername } from "@/lib/username";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ProfileRow = {
  username: string;
  display_username: string | null;
  city: string | null;
  created_at: string | null;
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

  const [
    { data: profiles, error: profilesError },
    { data: visits, error: visitsError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_username, city, created_at")
      .order("created_at", { ascending: false })
      .returns<ProfileRow[]>(),
    supabase
      .from("address_visits")
      .select("username, visitor_id, is_unique")
      .returns<VisitRow[]>(),
  ]);

  if (profilesError || visitsError) {
    console.error("Admin analytics failed", profilesError || visitsError);
    return NextResponse.json({ message: "Unable to load analytics" }, { status: 500 });
  }

  const rows = profiles || [];
  const visitRows = visits || [];
  const stats = getVisitStats(visitRows);
  const rankedAddresses = rows
    .map((profile) => ({
      username: profile.username,
      display_username: profile.display_username || profile.username,
      city: profile.city,
      total_visits: stats.get(profile.username)?.total_visits || 0,
      unique_visitors: stats.get(profile.username)?.unique_visitors || 0,
    }))
    .sort((a, b) => b.total_visits - a.total_visits);

  return NextResponse.json({
    total_registered_addresses: rows.length,
    total_visits: visitRows.length,
    total_unique_visitors: Array.from(stats.values()).reduce(
      (sum, row) => sum + row.unique_visitors,
      0
    ),
    latest_registered_addresses: rows.slice(0, 10),
    most_visited_addresses: rankedAddresses.slice(0, 10),
  });
}
