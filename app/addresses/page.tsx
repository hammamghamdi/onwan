"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AddressProfile = {
  username: string;
  city: string | null;
  owner_token: string | null;
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<AddressProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState("");

  const getPublicUrl = (username: string) => {
    return typeof window !== "undefined"
      ? `${window.location.origin}/${username}`
      : `/${username}`;
  };

  useEffect(() => {
    const loadAddresses = async () => {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log(userError);
        setMessage("تعذر التحقق من تسجيل الدخول.");
        setLoading(false);
        return;
      }

      if (!user) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("username, city, owner_token")
        .eq("user_id", user.id)
        .order("username", { ascending: true });

      if (error) {
        console.log(error);
        setMessage("تعذر تحميل عناوينك.");
        setLoading(false);
        return;
      }

      setAddresses(data || []);
      setLoading(false);
    };

    loadAddresses();
  }, []);

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-4 py-6 text-black">
      <div className="mx-auto max-w-sm">
        <section className="mb-4 rounded-3xl bg-white p-5 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-bold text-black">عناويني</h1>
          <p className="leading-7 text-gray-700">
            العناوين المرتبطة ببريدك الإلكتروني.
          </p>
        </section>

        {loading && (
          <div className="rounded-3xl bg-white p-5 text-center font-bold shadow-sm">
            جاري تحميل العناوين...
          </div>
        )}

        {!loading && !isLoggedIn && (
          <section className="rounded-3xl bg-white p-5 text-center shadow-sm">
            <p className="mb-4 font-bold text-black">
              سجل دخولك أولًا لعرض عناوينك.
            </p>
            <Link
              href="/login"
              className="block w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white"
            >
              تسجيل الدخول
            </Link>
          </section>
        )}

        {!loading && isLoggedIn && message && (
          <p className="mb-4 rounded-xl bg-red-100 p-3 text-center font-bold text-red-700">
            {message}
          </p>
        )}

        {!loading && isLoggedIn && !message && addresses.length === 0 && (
          <section className="rounded-3xl bg-white p-5 text-center shadow-sm">
            <p className="font-bold text-black">
              لا توجد عناوين مرتبطة بهذا الحساب حتى الآن.
            </p>
          </section>
        )}

        {!loading && isLoggedIn && addresses.length > 0 && (
          <div className="space-y-3">
            {addresses.map((address) => {
              const publicUrl = getPublicUrl(address.username);

              return (
                <section
                  key={address.username}
                  className="rounded-3xl bg-white p-5 shadow-sm"
                >
                  <h2 className="mb-2 text-xl font-bold text-black">
                    {address.username}
                  </h2>
                  <p className="mb-3 text-gray-700">
                    {address.city || "لم يتم إدخال المدينة"}
                  </p>
                  <p dir="ltr" className="mb-4 break-all text-sm text-gray-600">
                    {publicUrl}
                  </p>

                  <Link
                    href={`/${address.username}`}
                    className="mb-3 block w-full rounded-xl bg-[#006b4f] py-4 text-center font-bold text-white"
                  >
                    عرض العنوان
                  </Link>

                  {address.owner_token && (
                    <Link
                      href={`/manage?name=${address.username}&token=${address.owner_token}`}
                      className="block w-full rounded-xl border border-black py-4 text-center font-bold text-black"
                    >
                      تعديل العنوان
                    </Link>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
