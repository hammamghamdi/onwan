"use client";

import { fetchAdminJson, getAdminAuthHeaders } from "@/lib/adminClient";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ReportStatus = "new" | "reviewed" | "ignored" | "action_taken";

type AbuseReport = {
  id: string;
  reported_username: string;
  reported_url: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
};

type AddressRow = {
  username: string;
  display_username: string | null;
  city: string | null;
  created_at: string | null;
  is_suspended: boolean | null;
  suspended_reason: string | null;
  total_visits: number;
  unique_visitors: number;
};

type ReportsResponse = {
  reports: AbuseReport[];
};

type AddressesResponse = {
  total: number;
  page: number;
  page_size: number;
  rows: AddressRow[];
};

const pageSize = 25;
const statuses: ReportStatus[] = ["new", "reviewed", "ignored", "action_taken"];

const formatDate = (value: string | null) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatNumber = (value: number) => new Intl.NumberFormat("ar-SA").format(value);

export default function AdminPage() {
  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [totalAddresses, setTotalAddresses] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalAddresses / pageSize)),
    [totalAddresses]
  );

  const loadReports = async () => {
    const result = await fetchAdminJson<ReportsResponse>("/api/admin/reports");
    if (result.data) setReports(result.data.reports);
  };

  const loadAddresses = async () => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      username: search,
    });
    const result = await fetchAdminJson<AddressesResponse>(
      `/api/admin/addresses?${params}`
    );

    if (result.data) {
      setAddresses(result.data.rows);
      setTotalAddresses(result.data.total);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      await Promise.all([loadReports(), loadAddresses()]);
      if (!isMounted) return;
      setLoading(false);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [page, search]);

  const updateReportStatus = async (id: string, status: ReportStatus) => {
    const headers = await getAdminAuthHeaders();
    if (!headers) return;

    const response = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status }),
    });

    if (!response.ok) {
      setMessage("تعذر تحديث البلاغ.");
      return;
    }

    setMessage("تم تحديث البلاغ.");
    loadReports();
  };

  const updateSuspension = async (
    username: string,
    suspend: boolean,
    reason?: string
  ) => {
    const headers = await getAdminAuthHeaders();
    if (!headers) return;

    const response = await fetch("/api/admin/addresses", {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, suspend, reason }),
    });

    if (!response.ok) {
      setMessage("تعذر تحديث حالة العنوان.");
      return;
    }

    setMessage(suspend ? "تم تعليق العنوان." : "تم إلغاء التعليق.");
    loadAddresses();
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-4 py-6 text-black">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#006b4f]">لوحة الإدارة</p>
            <h1 className="text-3xl font-black">إدارة Onwan</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link className="rounded-full bg-[#006b4f] px-4 py-2 text-sm font-bold text-white" href="/admin/analytics">
              التحليلات
            </Link>
            <Link className="rounded-full bg-[#006b4f] px-4 py-2 text-sm font-bold text-white" href="/admin/monitor">
              المراقبة
            </Link>
            <Link className="rounded-full border border-[#006b4f] px-4 py-2 text-sm font-bold text-[#006b4f]" href="/">
              الرئيسية
            </Link>
          </nav>
        </header>

        {message && (
          <p className="mb-4 rounded-xl bg-white p-3 text-center font-bold text-[#006b4f] shadow-sm">
            {message}
          </p>
        )}

        {loading && (
          <section className="mb-4 rounded-2xl bg-white p-5 text-center font-bold shadow-sm">
            جاري التحميل...
          </section>
        )}

        <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-black">بلاغات إساءة الاستخدام</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right text-sm">
              <thead className="bg-[#eef5f1]">
                <tr>
                  <th className="p-3">العنوان</th>
                  <th className="p-3">الرابط</th>
                  <th className="p-3">السبب</th>
                  <th className="p-3">التفاصيل</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-t border-gray-100">
                    <td className="p-3 font-bold">{report.reported_username}</td>
                    <td className="p-3">
                      <a className="text-[#006b4f] underline" href={report.reported_url} target="_blank" rel="noopener noreferrer">
                        فتح
                      </a>
                    </td>
                    <td className="p-3">{report.reason}</td>
                    <td className="p-3">{report.details || "-"}</td>
                    <td className="p-3">
                      <select
                        value={report.status}
                        onChange={(event) =>
                          updateReportStatus(
                            report.id,
                            event.target.value as ReportStatus
                          )
                        }
                        className="rounded-lg border p-2"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">{formatDate(report.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black">إدارة العناوين</h2>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="بحث باسم العنوان"
              className="rounded-xl border p-3"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-right text-sm">
              <thead className="bg-[#eef5f1]">
                <tr>
                  <th className="p-3">العنوان العام</th>
                  <th className="p-3">المدينة</th>
                  <th className="p-3">تاريخ الإنشاء</th>
                  <th className="p-3">الزيارات</th>
                  <th className="p-3">الفريدة</th>
                  <th className="p-3">التعليق</th>
                  <th className="p-3">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {addresses.map((address) => {
                  const displayUsername =
                    address.display_username || address.username;

                  return (
                    <tr key={address.username} className="border-t border-gray-100">
                      <td className="p-3">
                        <a className="font-bold text-[#006b4f] underline" href={`/${displayUsername}`} target="_blank" rel="noopener noreferrer">
                          /{displayUsername}
                        </a>
                      </td>
                      <td className="p-3">{address.city || "-"}</td>
                      <td className="p-3">{formatDate(address.created_at)}</td>
                      <td className="p-3">{formatNumber(address.total_visits)}</td>
                      <td className="p-3">{formatNumber(address.unique_visitors)}</td>
                      <td className="p-3">
                        {address.is_suspended ? (
                          <span className="rounded-full bg-red-100 px-3 py-1 font-bold text-red-700">
                            معلق
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-3 py-1 font-bold text-green-700">
                            نشط
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {address.is_suspended ? (
                          <button
                            type="button"
                            onClick={() => updateSuspension(address.username, false)}
                            className="rounded-lg border border-[#006b4f] px-3 py-2 font-bold text-[#006b4f]"
                          >
                            إلغاء التعليق
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              updateSuspension(
                                address.username,
                                true,
                                "مخالفة سياسة الاستخدام"
                              )
                            }
                            className="rounded-lg bg-red-700 px-3 py-2 font-bold text-white"
                          >
                            تعليق
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-xl border border-[#006b4f] px-4 py-3 font-bold text-[#006b4f] disabled:opacity-40"
            >
              السابق
            </button>
            <p className="font-bold">
              صفحة {formatNumber(page)} من {formatNumber(totalPages)}
            </p>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="rounded-xl border border-[#006b4f] px-4 py-3 font-bold text-[#006b4f] disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
