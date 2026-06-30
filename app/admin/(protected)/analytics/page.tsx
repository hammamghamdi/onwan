"use client";

import { fetchAdminJson } from "@/lib/adminClient";
import Link from "next/link";
import { useEffect, useState } from "react";

type AddressSummary = {
  username: string;
  display_username: string | null;
  city: string | null;
  created_at?: string | null;
  total_visits?: number;
  unique_visitors?: number;
};

type AnalyticsData = {
  total_registered_addresses: number;
  total_visits: number;
  total_unique_visitors: number;
  latest_registered_addresses: AddressSummary[];
  most_visited_addresses: AddressSummary[];
  raw_table_counts?: {
    address_visits: number;
    homepage_visits: number;
    public_address_access_logs: number;
  };
  retention_cleanup_warning?: boolean;
};

const formatNumber = (value: number | undefined) =>
  new Intl.NumberFormat("ar-SA").format(value || 0);

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(
    new Date(value)
  );
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      const result = await fetchAdminJson<AnalyticsData>("/api/admin/analytics");

      if (!result.data) {
        setMessage("تعذر تحميل التحليلات.");
        return;
      }

      setData(result.data);
    };

    loadAnalytics();
  }, []);

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-4 py-6 text-black">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#006b4f]">لوحة الإدارة</p>
            <h1 className="text-3xl font-black">تحليلات المنصة</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="rounded-full bg-[#006b4f] px-4 py-2 text-sm font-bold text-white">
              الإدارة
            </Link>
            <Link href="/admin/monitor" className="rounded-full border border-[#006b4f] px-4 py-2 text-sm font-bold text-[#006b4f]">
              المراقبة
            </Link>
          </div>
        </header>

        {message && (
          <section className="rounded-2xl bg-white p-5 text-center font-bold text-red-700 shadow-sm">
            {message}
          </section>
        )}

        {data && (
          <>
            {data.retention_cleanup_warning && (
              <section className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm font-bold text-amber-900 shadow-sm">
                Retention cleanup is not automated yet. Review cleanup preview and consider enabling pg_cron.
              </section>
            )}

            <section className="mb-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="mb-2 text-sm font-bold text-gray-500">إجمالي العناوين</p>
                <p className="text-3xl font-black text-[#006b4f]">
                  {formatNumber(data.total_registered_addresses)}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="mb-2 text-sm font-bold text-gray-500">إجمالي الزيارات</p>
                <p className="text-3xl font-black text-[#006b4f]">
                  {formatNumber(data.total_visits)}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="mb-2 text-sm font-bold text-gray-500">الزيارات الفريدة</p>
                <p className="text-3xl font-black text-[#006b4f]">
                  {formatNumber(data.total_unique_visitors)}
                </p>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-xl font-black">أحدث العناوين</h2>
                <div className="space-y-3">
                  {data.latest_registered_addresses.map((address) => (
                    <div key={address.username} className="border-b border-gray-100 pb-3">
                      <p dir="ltr" className="font-black text-[#006b4f]">
                        /{address.display_username || address.username}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.city || "-"} · {formatDate(address.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-xl font-black">الأكثر زيارة</h2>
                <div className="space-y-3">
                  {data.most_visited_addresses.map((address) => (
                    <div
                      key={address.username}
                      className="flex items-center justify-between border-b border-gray-100 pb-3"
                    >
                      <p dir="ltr" className="font-black text-[#006b4f]">
                        /{address.display_username || address.username}
                      </p>
                      <p className="font-black">
                        {formatNumber(address.total_visits)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
