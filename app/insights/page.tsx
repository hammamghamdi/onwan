"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  username: string;
  city: string | null;
};

type AddressVisit = {
  username: string;
};

export default function InsightsPage() {
  const [homepageVisits, setHomepageVisits] = useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [addressVisits, setAddressVisits] = useState<AddressVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
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
        .select("username");

      setHomepageVisits(homepageCount || 0);
      setProfiles(profilesData || []);
      setAddressVisits(visitsData || []);
      setLoading(false);
    };

    loadInsights();
  }, []);

  const visitCounts = addressVisits.reduce<Record<string, number>>(
    (acc, visit) => {
      acc[visit.username] = (acc[visit.username] || 0) + 1;
      return acc;
    },
    {}
  );

  const topAddresses = Object.entries(visitCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

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
          <p className="text-4xl font-bold text-[#006b4f]">{homepageVisits}</p>
        </div>

        <div className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600">العناوين المسجلة</p>
          <p className="text-4xl font-bold text-[#006b4f]">{profiles.length}</p>
        </div>

        <div className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600">زيارات صفحات العناوين</p>
          <p className="text-4xl font-bold text-[#006b4f]">
            {addressVisits.length}
          </p>
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
          <h2 className="mb-4 text-xl font-bold">الأكثر زيارة</h2>

          <div className="space-y-3">
            {topAddresses.map(([username, count]) => (
              <div
                key={username}
                className="flex items-center justify-between rounded-2xl bg-gray-50 p-3"
              >
                <span className="font-bold">{username}</span>
                <span>{count} زيارة</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}