"use client";

import { fetchAdminJson } from "@/lib/adminClient";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MonitorRow = {
  username: string;
  display_username: string | null;
  city: string | null;
  created_at: string | null;
  total_visits: number;
  unique_visitors: number;
  is_suspended: boolean | null;
};

type MonitorData = {
  total: number;
  page: number;
  page_size: number;
  rows: MonitorRow[];
};

const pageSize = 50;
const formatNumber = (value: number | undefined) =>
  new Intl.NumberFormat("ar-SA").format(value || 0);

export default function AdminMonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [username, setUsername] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total || 0) / pageSize)),
    [data?.total]
  );

  useEffect(() => {
    const loadMonitor = async () => {
      const params = new URLSearchParams({
        username,
        page: String(page),
        page_size: String(pageSize),
      });
      const result = await fetchAdminJson<MonitorData>(
        `/api/admin/monitor?${params}`
      );

      if (!result.data) {
        setMessage("تعذر تحميل بيانات المراقبة.");
        return;
      }

      setData(result.data);
      setMessage("");
    };

    loadMonitor();
  }, [page, username]);

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-4 py-6 text-black">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#006b4f]">لوحة الإدارة</p>
            <h1 className="text-3xl font-black">مراقبة العناوين</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="rounded-full bg-[#006b4f] px-4 py-2 text-sm font-bold text-white">
              الإدارة
            </Link>
            <Link href="/admin/analytics" className="rounded-full border border-[#006b4f] px-4 py-2 text-sm font-bold text-[#006b4f]">
              التحليلات
            </Link>
          </div>
        </header>

        <section className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <input
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setPage(1);
            }}
            placeholder="بحث باسم العنوان"
            className="rounded-xl border border-gray-200 p-3"
          />
          <p className="font-bold text-[#006b4f]">
            الإجمالي: {formatNumber(data?.total)}
          </p>
        </section>

        {message && (
          <section className="rounded-2xl bg-white p-5 text-center font-bold text-red-700 shadow-sm">
            {message}
          </section>
        )}

        {data && (
          <>
            <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-right text-sm">
                  <thead className="bg-[#eef5f1] text-[#1f2d2b]">
                    <tr>
                      <th className="p-3">رابط العنوان العام</th>
                      <th className="p-3">المدينة</th>
                      <th className="p-3">إجمالي الزيارات</th>
                      <th className="p-3">الزيارات الفريدة</th>
                      <th className="p-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => {
                      const displayUsername = row.display_username || row.username;

                      return (
                        <tr key={row.username} className="border-t border-gray-100">
                          <td className="p-3">
                            <a
                              href={`/${displayUsername}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-black text-[#006b4f] underline"
                            >
                              <span dir="ltr">/{displayUsername}</span>
                            </a>
                          </td>
                          <td className="p-3">{row.city || "-"}</td>
                          <td className="p-3 font-bold">
                            {formatNumber(row.total_visits)}
                          </td>
                          <td className="p-3 font-bold">
                            {formatNumber(row.unique_visitors)}
                          </td>
                          <td className="p-3">
                            {row.is_suspended ? "معلق" : "نشط"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-xl border border-[#006b4f] px-4 py-3 font-bold text-[#006b4f] disabled:opacity-40"
              >
                السابق
              </button>
              <p className="text-sm font-bold">
                صفحة {formatNumber(page)} من {formatNumber(totalPages)}
              </p>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="rounded-xl border border-[#006b4f] px-4 py-3 font-bold text-[#006b4f] disabled:opacity-40"
              >
                التالي
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
