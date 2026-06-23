"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TrendPoint = {
  date: string;
  value: number;
};

type RankedAddress = {
  username: string;
  city: string | null;
  total_visits: number;
  unique_visitors: number;
};

type RankedCity = {
  city: string;
  total_visits: number;
  addresses: number;
};

type AnalyticsData = {
  total_registered_addresses: number;
  total_visits: number;
  total_unique_visitors: number;
  addresses_created_today: number;
  addresses_created_this_week: number;
  addresses_created_this_month: number;
  most_visited_addresses: RankedAddress[];
  most_visited_cities: RankedCity[];
  new_registrations_trend: TrendPoint[];
  visits_trend: TrendPoint[];
  unique_visitors_trend: TrendPoint[];
};

const formatNumber = (value: number | undefined) =>
  new Intl.NumberFormat("ar-SA").format(value || 0);

function MiniBars({ data }: { data: TrendPoint[] }) {
  const maxValue = useMemo(
    () => Math.max(1, ...data.map((point) => point.value)),
    [data]
  );

  return (
    <div className="flex h-28 items-end gap-1">
      {data.map((point) => (
        <div
          key={point.date}
          title={`${point.date}: ${point.value}`}
          className="flex flex-1 items-end rounded-t bg-[#006b4f]/15"
        >
          <div
            className="w-full rounded-t bg-[#006b4f]"
            style={{ height: `${Math.max(8, (point.value / maxValue) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!session) {
        setMessage("سجّل الدخول بحساب المالك لعرض لوحة التحليلات.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/analytics", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!isMounted) return;

      if (!response.ok) {
        setMessage(
          response.status === 403
            ? "لا تملك صلاحية الوصول لهذه الصفحة."
            : "تعذر تحميل التحليلات."
        );
        setLoading(false);
        return;
      }

      setData((await response.json()) as AnalyticsData);
      setLoading(false);
    };

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  const kpis = [
    ["إجمالي العناوين", data?.total_registered_addresses],
    ["إجمالي الزيارات", data?.total_visits],
    ["الزوار الفريدون", data?.total_unique_visitors],
    ["عناوين اليوم", data?.addresses_created_today],
    ["عناوين هذا الأسبوع", data?.addresses_created_this_week],
    ["عناوين هذا الشهر", data?.addresses_created_this_month],
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-4 py-6 text-black">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#006b4f]">لوحة المالك</p>
            <h1 className="text-3xl font-black">تحليلات المنصة</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/monitor"
              className="rounded-full bg-[#006b4f] px-4 py-2 text-sm font-bold text-white"
            >
              المراقبة
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[#006b4f] px-4 py-2 text-sm font-bold text-[#006b4f]"
            >
              الرئيسية
            </Link>
          </div>
        </header>

        {loading && (
          <section className="rounded-2xl bg-white p-5 text-center font-bold shadow-sm">
            جاري تحميل التحليلات...
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

        {data && (
          <>
            <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {kpis.map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="mb-2 text-sm font-bold text-gray-500">{label}</p>
                  <p className="text-3xl font-black text-[#006b4f]">
                    {formatNumber(value as number)}
                  </p>
                </div>
              ))}
            </section>

            <section className="mb-5 grid gap-3 lg:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-black">اتجاه التسجيلات الجديدة</h2>
                <MiniBars data={data.new_registrations_trend} />
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-black">اتجاه الزيارات</h2>
                <MiniBars data={data.visits_trend} />
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-black">اتجاه الزوار الفريدين</h2>
                <MiniBars data={data.unique_visitors_trend} />
              </div>
            </section>

            <section className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-black">العناوين الأكثر زيارة</h2>
                <div className="space-y-3">
                  {data.most_visited_addresses.map((address) => (
                    <div
                      key={address.username}
                      className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3"
                    >
                      <div>
                        <p dir="ltr" className="font-black">
                          /{address.username}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.city || "غير محدد"}
                        </p>
                      </div>
                      <p className="font-black text-[#006b4f]">
                        {formatNumber(address.total_visits)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-black">المدن الأكثر زيارة</h2>
                <div className="space-y-3">
                  {data.most_visited_cities.map((city) => (
                    <div
                      key={city.city}
                      className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3"
                    >
                      <div>
                        <p className="font-black">{city.city}</p>
                        <p className="text-sm text-gray-600">
                          {formatNumber(city.addresses)} عنوان
                        </p>
                      </div>
                      <p className="font-black text-[#006b4f]">
                        {formatNumber(city.total_visits)}
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
