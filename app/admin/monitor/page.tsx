"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MonitorRow = {
  username: string;
  city: string | null;
  created_at: string;
  total_visits: number;
  unique_visitors: number;
  last_visit_at: string | null;
  photo_count: number;
  status: "new" | "active" | "inactive";
};

type MonitorData = {
  total: number;
  page: number;
  page_size: number;
  rows: MonitorRow[];
};

const pageSize = 25;

const statusLabel = {
  new: "جديد",
  active: "نشط",
  inactive: "غير نشط",
};

const statusClass = {
  new: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-700",
};

const formatNumber = (value: number | undefined) =>
  new Intl.NumberFormat("ar-SA").format(value || 0);

const formatDate = (value: string | null) => {
  if (!value) return "لا يوجد";

  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export default function AdminMonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState("created_desc");
  const [page, setPage] = useState(1);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((data?.total || 0) / pageSize));
  }, [data?.total]);

  useEffect(() => {
    let isMounted = true;

    const loadMonitor = async () => {
      setLoading(true);
      setMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!session) {
        setMessage("سجّل الدخول بحساب المالك لعرض صفحة المراقبة.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        username,
        city,
        sort,
        page: String(page),
        page_size: String(pageSize),
      });

      const response = await fetch(`/api/admin/monitor?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!isMounted) return;

      if (!response.ok) {
        setMessage(
          response.status === 403
            ? "لا تملك صلاحية الوصول لهذه الصفحة."
            : "تعذر تحميل بيانات المراقبة."
        );
        setLoading(false);
        return;
      }

      setData((await response.json()) as MonitorData);
      setLoading(false);
    };

    const timer = setTimeout(loadMonitor, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [city, page, sort, username]);

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-4 py-6 text-black">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#006b4f]">لوحة المالك</p>
            <h1 className="text-3xl font-black">مراقبة العناوين</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/analytics"
              className="rounded-full bg-[#006b4f] px-4 py-2 text-sm font-bold text-white"
            >
              التحليلات
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[#006b4f] px-4 py-2 text-sm font-bold text-[#006b4f]"
            >
              الرئيسية
            </Link>
          </div>
        </header>

        <section className="mb-4 grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-4">
          <input
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setPage(1);
            }}
            placeholder="بحث باسم العنوان"
            className="rounded-xl border border-gray-200 p-3"
          />
          <input
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setPage(1);
            }}
            placeholder="بحث بالمدينة"
            className="rounded-xl border border-gray-200 p-3"
          />
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 p-3"
          >
            <option value="created_desc">الأحدث إنشاءً</option>
            <option value="created_asc">الأقدم إنشاءً</option>
            <option value="visits_desc">الأكثر زيارة</option>
            <option value="visits_asc">الأقل زيارة</option>
            <option value="last_visit_desc">آخر زيارة أولاً</option>
            <option value="last_visit_asc">أقدم زيارة أولاً</option>
          </select>
          <div className="rounded-xl bg-[#eef5f1] p-3 text-sm font-bold text-[#006b4f]">
            الإجمالي: {formatNumber(data?.total)}
          </div>
        </section>

        {loading && (
          <section className="rounded-2xl bg-white p-5 text-center font-bold shadow-sm">
            جاري تحميل العناوين...
          </section>
        )}

        {!loading && message && (
          <section className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <p className="mb-4 font-bold text-red-700">{message}</p>
            <Link
              href="/login"
              className="inline-block rounded-xl bg-[#006b4f] px-5 py-3 font-bold text-white"
            >
              تسجيل الدخول
            </Link>
          </section>
        )}

        {!loading && data && (
          <>
            <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-right text-sm">
                  <thead className="bg-[#eef5f1] text-[#1f2d2b]">
                    <tr>
                      <th className="p-3">العنوان العام</th>
                      <th className="p-3">المدينة</th>
                      <th className="p-3">تاريخ الإنشاء</th>
                      <th className="p-3">الزيارات</th>
                      <th className="p-3">الزوار الفريدون</th>
                      <th className="p-3">آخر زيارة</th>
                      <th className="p-3">الصور</th>
                      <th className="p-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={row.username} className="border-t border-gray-100">
                        <td className="p-3">
                          <Link
                            href={`/${row.username}`}
                            className="font-black text-[#006b4f]"
                          >
                            <span dir="ltr">/{row.username}</span>
                          </Link>
                        </td>
                        <td className="p-3">{row.city || "غير محدد"}</td>
                        <td className="p-3">{formatDate(row.created_at)}</td>
                        <td className="p-3 font-bold">
                          {formatNumber(row.total_visits)}
                        </td>
                        <td className="p-3 font-bold">
                          {formatNumber(row.unique_visitors)}
                        </td>
                        <td className="p-3">{formatDate(row.last_visit_at)}</td>
                        <td className="p-3">{formatNumber(row.photo_count)}</td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[row.status]}`}
                          >
                            {statusLabel[row.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
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
