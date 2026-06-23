import { requireAdmin } from "@/lib/adminApi";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin(request);

    if (error) return error;

    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("page_size") || "25");

    const { data, error: monitorError } = await supabase.rpc(
      "admin_address_monitor",
      {
        p_search_username: searchParams.get("username") || "",
        p_search_city: searchParams.get("city") || "",
        p_sort: searchParams.get("sort") || "created_desc",
        p_page: Number.isFinite(page) ? page : 1,
        p_page_size: Number.isFinite(pageSize) ? pageSize : 25,
      }
    );

    if (monitorError) {
      console.error("Admin monitor failed", monitorError);
      return NextResponse.json(
        { message: "تعذر تحميل المراقبة" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin monitor route failed", error);
    return NextResponse.json(
      { message: "تعذر تحميل المراقبة" },
      { status: 500 }
    );
  }
}
