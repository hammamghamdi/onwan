import { requireAdmin } from "@/lib/adminApi";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin(request);

    if (error) return error;

    const { data, error: analyticsError } = await supabase.rpc(
      "admin_platform_analytics"
    );

    if (analyticsError) {
      console.error("Admin analytics failed", analyticsError);
      return NextResponse.json(
        { message: "تعذر تحميل التحليلات" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin analytics route failed", error);
    return NextResponse.json(
      { message: "تعذر تحميل التحليلات" },
      { status: 500 }
    );
  }
}
