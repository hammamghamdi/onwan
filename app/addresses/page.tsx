"use client";

import { LanguageNav } from "@/app/components/LanguageNav";
import { createDisplayUrl, createPublicAddressUrl } from "@/lib/appUrl";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/useLanguage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AddressProfile = {
  username: string;
  display_username: string | null;
  city: string | null;
};

const copy = {
  ar: {
    authCheckError: "تعذر التحقق من تسجيل الدخول.",
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
    deleteAccountTitle: "حذف الحساب",
    deleteAccountBody:
      "حذف الحساب إجراء نهائي ولا يمكن التراجع عنه. سيتم حذف عناوينك وبيانات الوصول والصور المرتبطة بها.",
    deleteAccountConfirmLabel: "للتأكيد اكتب: حذف الحساب",
    deleteAccountPlaceholder: "حذف الحساب",
    deleteAccountButton: "حذف الحساب نهائيًا",
    deleteAccountCancel: "إلغاء",
    deletingAccount: "جاري حذف الحساب...",
    deleteAccountError: "تعذر حذف الحساب. حاول مرة أخرى.",
  },
  en: {
    authCheckError: "Could not verify your login.",
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
    deleteAccountTitle: "Delete account",
    deleteAccountBody:
      "Deleting your account is final and cannot be undone. Your addresses, access data, and related photos will be removed.",
    deleteAccountConfirmLabel: "To confirm, type: DELETE",
    deleteAccountPlaceholder: "DELETE",
    deleteAccountButton: "Delete account permanently",
    deleteAccountCancel: "Cancel",
    deletingAccount: "Deleting account...",
    deleteAccountError: "Could not delete your account. Try again.",
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log(error);
      setMessage(text.logoutError);
      return;
    }

    router.push("/");
  };

  const deleteAccount = async () => {
    const expectedConfirmation = language === "en" ? "DELETE" : "حذف الحساب";

    if (deleteConfirmation.trim() !== expectedConfirmation || deletingAccount) {
      return;
    }

    setDeletingAccount(true);
    setMessage("");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log(sessionError);
      setMessage(text.authCheckError);
      setDeletingAccount(false);
      return;
    }

    const response = await fetch("/api/account/delete", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      console.log(result?.message || response.statusText);
      setMessage(text.deleteAccountError);
      setDeletingAccount(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/account-deleted");
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

      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_username, city")
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
  }, [text.authCheckError, text.loadError]);

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
              const displayUsername =
                address.display_username || address.username;
              const publicUrl = createPublicAddressUrl(displayUsername);
              const displayPublicUrl = createDisplayUrl(publicUrl);

              return (
                <section
                  key={address.username}
                  className="rounded-3xl bg-white p-5 shadow-sm"
                >
                  <h2 className="mb-2 text-xl font-bold text-black">
                    {displayUsername}
                  </h2>
                  <p className="mb-3 text-gray-700">
                    {address.city || text.noCity}
                  </p>
                  <p dir="ltr" className="mb-4 break-all text-sm text-gray-600">
                    {displayPublicUrl}
                  </p>

                  <Link
                    href={`/${displayUsername}`}
                    className="mb-3 block w-full rounded-xl bg-[#006b4f] py-4 text-center font-bold text-white"
                  >
                    {text.view}
                  </Link>

                  <Link
                    href={`/addresses/${encodeURIComponent(address.username)}/edit`}
                    className="block w-full rounded-xl border border-black py-4 text-center font-bold text-black"
                  >
                    {text.edit}
                  </Link>
                </section>
              );
            })}
          </div>
        )}

        {!loading && isLoggedIn && (
          <>
            <button
              onClick={signOut}
              className="mt-4 w-full rounded-xl border border-black bg-white py-4 font-bold text-black shadow-sm"
            >
              {text.logout}
            </button>

            <section className="mt-4 rounded-3xl border border-red-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-black text-red-700">
                {text.deleteAccountTitle}
              </h2>
              <p className="mb-4 leading-7 text-gray-700">
                {text.deleteAccountBody}
              </p>

              {!deleteConfirmOpen ? (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmOpen(true);
                    setDeleteConfirmation("");
                  }}
                  className="w-full rounded-xl border border-red-700 py-4 font-bold text-red-700"
                >
                  {text.deleteAccountTitle}
                </button>
              ) : (
                <div>
                  <label className="mb-2 block font-bold text-black">
                    {text.deleteAccountConfirmLabel}
                  </label>
                  <input
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    className="mb-3 w-full rounded-xl border p-4 text-black"
                    placeholder={text.deleteAccountPlaceholder}
                  />
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={deleteAccount}
                      disabled={
                        deletingAccount ||
                        deleteConfirmation.trim() !==
                          (language === "en" ? "DELETE" : "حذف الحساب")
                      }
                      className="w-full rounded-xl bg-red-700 py-4 font-bold text-white disabled:opacity-50"
                    >
                      {deletingAccount
                        ? text.deletingAccount
                        : text.deleteAccountButton}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmOpen(false);
                        setDeleteConfirmation("");
                      }}
                      disabled={deletingAccount}
                      className="w-full rounded-xl border border-black py-4 font-bold text-black disabled:opacity-50"
                    >
                      {text.deleteAccountCancel}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
