"use client";

import { LanguageNav } from "@/app/components/LanguageNav";
import { createPublicAddressUrl } from "@/lib/appUrl";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/useLanguage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AddressProfile = {
  username: string;
  city: string | null;
  owner_token: string | null;
};

const copy = {
  ar: {
    authCheckError: "تعذر التحقق من تسجيل الدخول.",
    claimError: "تم تسجيل الدخول، لكن تعذر ربط العناوين بهذا البريد.",
    loadError: "تعذر تحميل عناوينك.",
    logoutError: "تعذر تسجيل الخروج. حاول مرة أخرى.",
    title: "عناويني",
    intro: "العناوين المرتبطة ببريدك الإلكتروني.",
    loading: "جاري تحميل العناوين...",
    loginPrompt: "سجل دخولك أولاً لعرض عناوينك.",
    login: "تسجيل الدخول",
    empty: "لا توجد عناوين مرتبطة بهذا الحساب حتى الآن.",
    noCity: "لم يتم إدخال المدينة",
    view: "عرض العنوان",
    edit: "تعديل العنوان",
    logout: "تسجيل الخروج",
  },
  en: {
    authCheckError: "Could not verify your login.",
    claimError: "You are signed in, but we could not link addresses to this email.",
    loadError: "Could not load your addresses.",
    logoutError: "Could not log out. Try again.",
    title: "My Addresses",
    intro: "Addresses linked to your email.",
    loading: "Loading addresses...",
    loginPrompt: "Log in first to view your addresses.",
    login: "Log In",
    empty: "No addresses are linked to this account yet.",
    noCity: "No city entered",
    view: "View Address",
    edit: "Edit Address",
    logout: "Log Out",
  },
};

export default function AddressesPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const text = copy[language];
  const [addresses, setAddresses] = useState<AddressProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState("");

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log(error);
      setMessage(text.logoutError);
      return;
    }

    router.push("/");
  };

  useEffect(() => {
    let isMounted = true;

    const loadAddresses = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (userError) {
        console.log(userError);
        setMessage(text.authCheckError);
        setLoading(false);
        return;
      }

      if (!user) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      if (user.email) {
        const { error: claimError } = await supabase
          .from("profiles")
          .update({ user_id: user.id })
          .eq("email", user.email.trim().toLowerCase())
          .is("user_id", null);

        if (!isMounted) return;

        if (claimError) {
          console.log(claimError);
          setMessage(text.claimError);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("username, city, owner_token")
        .eq("user_id", user.id)
        .order("username", { ascending: true });

      if (!isMounted) return;

      if (error) {
        console.log(error);
        setMessage(text.loadError);
        setLoading(false);
        return;
      }

      setMessage("");
      setAddresses(data || []);
      setLoading(false);
    };

    loadAddresses();

    return () => {
      isMounted = false;
    };
  }, [text.authCheckError, text.claimError, text.loadError]);

  return (
    <main
      dir={language === "en" ? "ltr" : "rtl"}
      className="min-h-screen bg-[#f7f8f5] px-4 py-6 text-black"
    >
      <LanguageNav language={language} setLanguage={setLanguage} />

      <div className="mx-auto max-w-sm">
        <section className="mb-4 rounded-3xl bg-white p-5 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-bold text-black">{text.title}</h1>
          <p className="leading-7 text-gray-700">{text.intro}</p>
        </section>

        {loading && (
          <div className="rounded-3xl bg-white p-5 text-center font-bold shadow-sm">
            {text.loading}
          </div>
        )}

        {!loading && !isLoggedIn && (
          <section className="rounded-3xl bg-white p-5 text-center shadow-sm">
            <p className="mb-4 font-bold text-black">{text.loginPrompt}</p>
            <Link
              href="/login"
              className="block w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white"
            >
              {text.login}
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
            <p className="font-bold text-black">{text.empty}</p>
          </section>
        )}

        {!loading && isLoggedIn && addresses.length > 0 && (
          <div className="space-y-3">
            {addresses.map((address) => {
              const publicUrl = createPublicAddressUrl(address.username);

              return (
                <section
                  key={address.username}
                  className="rounded-3xl bg-white p-5 shadow-sm"
                >
                  <h2 className="mb-2 text-xl font-bold text-black">
                    {address.username}
                  </h2>
                  <p className="mb-3 text-gray-700">
                    {address.city || text.noCity}
                  </p>
                  <p dir="ltr" className="mb-4 break-all text-sm text-gray-600">
                    {publicUrl}
                  </p>

                  <Link
                    href={`/${address.username}`}
                    className="mb-3 block w-full rounded-xl bg-[#006b4f] py-4 text-center font-bold text-white"
                  >
                    {text.view}
                  </Link>

                  {address.owner_token && (
                    <Link
                      href={`/manage?name=${address.username}&token=${address.owner_token}`}
                      className="block w-full rounded-xl border border-black py-4 text-center font-bold text-black"
                    >
                      {text.edit}
                    </Link>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {!loading && isLoggedIn && (
          <button
            onClick={signOut}
            className="mt-4 w-full rounded-xl border border-black bg-white py-4 font-bold text-black shadow-sm"
          >
            {text.logout}
          </button>
        )}
      </div>
    </main>
  );
}
