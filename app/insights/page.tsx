"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  username: string;
  city: string | null;
};

type AddressVisit = {
  username: string;
  is_unique: boolean | null;
};

type Snapshot = {
  homepageVisitors: number;
  totalVisits: number;
  uniqueVisits: number;
  addressStats: Record<string, { total: number; unique: number }>;
};

export default function InsightsPage() {
  const [homepageVisitors, setHomepageVisitors] = useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [addressVisits, setAddressVisits] = useState<AddressVisit[]>([]);
  const [previousSnapshot, setPreviousSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      const snapshotKey = "onwan_insights_snapshot";
      const savedSnapshot = localStorage.getItem(snapshotKey);

      if (savedSnapshot) {
        setPreviousSnapshot(JSON.parse(savedSnapshot));
      }

      const { count: homepageCount } = await supabase
        .from("homepage_visits")
        .select("*", { count: "exact", head: true });

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("username, city")
        .order("username", { ascending: false })
        .limit(10);

      const { data: visitsData } = await supabase
        .from("address_visits")
        .select("username, is_unique");

      setHomepageVisitors(homepageCount || 0);
      setProfiles(profilesData || []);
      setAddressVisits(visitsData || []);
      setLoading(false);
    };

    loadInsights();
  }, []);

  const totalVisits = addressVisits.length;
  const uniqueVisits = addressVisits.filter((visit) => visit.is_unique).length;

  const addressStats = addressVisits.reduce<
    Record<string, { total: number; unique: number }>
  >((acc, visit) => {
    if (!acc[visit.username]) {
      acc[visit.username] = { total: 0, unique: 0 };
    }

    acc[visit.username].total += 1;

    if (visit.is_unique) {
      acc[visit.username].unique += 1;
    }

    return acc;
  }, {});

  const topAddresses = Object.entries(addressStats)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  useEffect(() => {
    if (loading) return;

    const snapshotKey = "onwan_insights_snapshot";

    const currentSnapshot: Snapshot = {
      homepageVisitors,
      totalVisits,
      uniqueVisits,
      addressStats,
    };

    localStorage.setItem(snapshotKey, JSON.stringify(currentSnapshot));
  }, [loading, homepageVisitors, totalVisits, uniqueVisits, addressStats]);

  const getDiff = (current: number, previous?: number) => {
    const diff = current - (previous || 0);

    if (diff <= 0) return null;

    return (
      <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
        +{diff} جديد
      </span>
    );
  };

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f7f8f5] p-5 text-black">
        جاري تحميل الإحصائيات...
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] p-5 text-black">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-center text-3xl font-bold">إحصائيات عنوان</h1>

        <div className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600">زوار الصفحة الرئيسية</p>
          <p className="text-4xl font-bold text-[#006b4f]">
            {homepageVisitors}
          </p>
          {getDiff(homepageVisitors, previousSnapshot?.homepageVisitors)}
        </div>

        <div className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600">العناوين المسجلة</p>
          <p className="text-4xl font-bold text-[#006b4f]">{profiles.length}</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">زيارات العناوين</p>
            <p className="text-3xl font-bold text-[#006b4f]">{totalVisits}</p>
            {getDiff(totalVisits, previousSnapshot?.totalVisits)}
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">الزوار الفريدون</p>
            <p className="text-3xl font-bold text-[#006b4f]">{uniqueVisits}</p>
            {getDiff(uniqueVisits, previousSnapshot?.uniqueVisits)}
          </div>
        </div>

        <section className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">آخر العناوين</h2>

          <div className="space-y-3">
            {profiles.map((profile) => (
              <div
                key={profile.username}
                className="rounded-2xl bg-gray-50 p-3"
              >
                <p className="font-bold">{profile.username}</p>
                <p className="text-sm text-gray-600">
                  {profile.city || "بدون مدينة"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">الأكثر مشاهدة</h2>

          <div className="space-y-3">
            {topAddresses.map(([username, stats]) => {
              const previousAddressStats =
                previousSnapshot?.addressStats?.[username];

              return (
                <div key={username} className="rounded-2xl bg-gray-50 p-3">
                  <p className="mb-2 font-bold">{username}</p>

                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <div>
                      <p>{stats.total} زيارة عامة</p>
                      {getDiff(stats.total, previousAddressStats?.total)}
                    </div>

                    <div className="text-left">
                      <p>{stats.unique} زائر فريد</p>
                      {getDiff(stats.unique, previousAddressStats?.unique)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}