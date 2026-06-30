import { requireAdmin } from "@/lib/adminApi";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { supabase, error } = await requireAdmin(request);

  if (error) return error;

  const { data, error: analyticsError } = await supabase.rpc(
    "admin_platform_analytics"
  );

  if (analyticsError) {
    console.error("Admin analytics failed", analyticsError);
    return NextResponse.json({ message: "Unable to load analytics" }, { status: 500 });
  }

  return NextResponse.json(
    data || {
      total_registered_addresses: 0,
      total_visits: 0,
      total_unique_visitors: 0,
      latest_registered_addresses: [],
      most_visited_addresses: [],
      raw_table_counts: {
        address_visits: 0,
        homepage_visits: 0,
        public_address_access_logs: 0,
      },
      retention_cleanup_warning: false,
    }
  );
}
