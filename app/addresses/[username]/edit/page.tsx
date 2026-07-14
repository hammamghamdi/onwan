"use client";

import { LanguageNav } from "@/app/components/LanguageNav";
import { supabase } from "@/lib/supabase";
import { normalizeUsername } from "@/lib/username";
import { useLanguage } from "@/lib/useLanguage";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type AddressDetails = {
  username: string;
  displayUsername: string;
  city: string;
  mapUrl: string;
  instructions: string;
  isSuspended: boolean;
  suspendedReason: string | null;
};

type AddressResponse = {
  address?: AddressDetails;
  message?: string;
};

const copy = {
  ar: {
    title: "تعديل العنوان",
    subtitle: "يمكنك تعديل بيانات الوصول الأساسية فقط.",
    addressLabel: "العنوان",
    cityLabel: "المدينة أو الحي",
    mapLabel: "رابط الموقع",
    instructionsLabel: "تعليمات الوصول",
    loading: "جاري تحميل العنوان...",
    notFound: "لم يتم العثور على العنوان أو لا تملك صلاحية تعديله.",
    authRequired: "يجب تسجيل الدخول لتعديل العنوان.",
    save: "حفظ التعديلات",
    saving: "جاري الحفظ...",
    saved: "تم حفظ التعديلات بنجاح.",
    failed: "تعذر حفظ التعديلات. حاول مرة أخرى.",
    invalid: "يرجى تعبئة المدينة، رابط الموقع، وتعليمات الوصول.",
    back: "العودة للعناوين",
    suspendedTitle: "هذا العنوان موقوف حاليًا.",
    suspendedBody: "يمكنك تعديل البيانات، لكن لن يظهر العنوان للعامة حتى تتم إعادة تفعيله.",
  },
  en: {
    title: "Edit address",
    subtitle: "You can update the core access details only.",
    addressLabel: "Address",
    cityLabel: "City or district",
    mapLabel: "Location link",
    instructionsLabel: "Access instructions",
    loading: "Loading address...",
    notFound: "Address was not found or you do not have access to edit it.",
    authRequired: "You need to sign in to edit this address.",
    save: "Save changes",
    saving: "Saving...",
    saved: "Changes saved successfully.",
    failed: "Could not save changes. Please try again.",
    invalid: "Please fill in the city, location link, and access instructions.",
    back: "Back to addresses",
    suspendedTitle: "This address is currently suspended.",
    suspendedBody: "You can edit its details, but it will stay hidden publicly until restored.",
  },
};

export default function EditAddressPage() {
  const router = useRouter();
  const params = useParams();
  const { language, setLanguage } = useLanguage();
  const text = copy[language];
  const rawUsername = params.username;
  const username = normalizeUsername(
    Array.isArray(rawUsername) ? rawUsername[0] || "" : rawUsername || ""
  );
  const editPath = useMemo(
    () => `/addresses/${encodeURIComponent(username)}/edit`,
    [username]
  );

  const [address, setAddress] = useState<AddressDetails | null>(null);
  const [city, setCity] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const redirectToLogin = useCallback(() => {
    const loginParams = new URLSearchParams({ redirect: editPath });
    router.replace(`/login?${loginParams.toString()}`);
  }, [editPath, router]);

  const loadAddress = useCallback(async () => {
    if (!username) {
      setError(text.notFound);
      setLoading(false);
      return;
    }

    let redirectingToLogin = false;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        redirectingToLogin = true;
        redirectToLogin();
        return;
      }

      const response = await fetch(`/api/addresses/${encodeURIComponent(username)}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      if (response.status === 401) {
        redirectingToLogin = true;
        redirectToLogin();
        return;
      }

      if (response.status === 404) {
        setError(text.notFound);
        return;
      }

      if (!response.ok) {
        setError(text.failed);
        return;
      }

      const result = (await response.json()) as AddressResponse;

      if (!result.address) {
        setError(text.notFound);
        return;
      }

      setAddress(result.address);
      setCity(result.address.city);
      setMapUrl(result.address.mapUrl);
      setInstructions(result.address.instructions);
    } catch {
      setError(text.failed);
    } finally {
      if (!redirectingToLogin) {
        setLoading(false);
      }
    }
  }, [redirectToLogin, text.failed, text.notFound, username]);

  useEffect(() => {
    loadAddress();
  }, [loadAddress]);

  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!city.trim() || !mapUrl.trim() || !instructions.trim()) {
      setError(text.invalid);
      return;
    }

    setSaving(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        redirectToLogin();
        return;
      }

      const response = await fetch(`/api/addresses/${encodeURIComponent(username)}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          city,
          mapUrl,
          instructions,
        }),
      });

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (response.status === 404) {
        setError(text.notFound);
        return;
      }

      if (!response.ok) {
        setError(response.status === 400 ? text.invalid : text.failed);
        return;
      }

      setMessage(text.saved);
    } catch {
      setError(text.failed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      dir={language === "en" ? "ltr" : "rtl"}
      className="min-h-screen bg-[#f6f2e9] px-4 py-6 text-[#111]"
    >
      <div className="mx-auto max-w-md">
        <LanguageNav language={language} setLanguage={setLanguage} />
        <div className="mb-6 flex justify-start">
          <Link href="/addresses" className="text-sm font-bold text-[#006b4f]">
            {text.back}
          </Link>
        </div>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-black">{text.title}</h1>
          <p className="mt-2 text-sm text-black/70">{text.subtitle}</p>

          {loading ? (
            <p className="mt-6 rounded-xl bg-[#f6f2e9] p-4 text-center text-sm font-bold">
              {text.loading}
            </p>
          ) : error && !address ? (
            <p className="mt-6 rounded-xl bg-red-50 p-4 text-center text-sm font-bold text-red-700">
              {error}
            </p>
          ) : (
            <form onSubmit={saveAddress} className="mt-6 space-y-4">
              {address?.isSuspended && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-black">{text.suspendedTitle}</p>
                  <p className="mt-1">{text.suspendedBody}</p>
                  {address.suspendedReason && (
                    <p className="mt-2 font-bold">{address.suspendedReason}</p>
                  )}
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-black">{text.addressLabel}</p>
                <div className="rounded-xl bg-[#f6f2e9] p-4 font-bold">
                  onwans.com/{address?.displayUsername || username}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-black">
                  {text.cityLabel}
                </span>
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="w-full rounded-xl border border-black/15 px-4 py-3 text-base outline-none focus:border-[#006b4f]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black">
                  {text.mapLabel}
                </span>
                <input
                  value={mapUrl}
                  onChange={(event) => setMapUrl(event.target.value)}
                  className="w-full rounded-xl border border-black/15 px-4 py-3 text-base outline-none focus:border-[#006b4f]"
                  dir="ltr"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black">
                  {text.instructionsLabel}
                </span>
                <textarea
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-black/15 px-4 py-3 text-base outline-none focus:border-[#006b4f]"
                />
              </label>

              {message && (
                <p className="rounded-xl bg-green-50 p-3 text-center text-sm font-bold text-green-700">
                  {message}
                </p>
              )}

              {error && (
                <p className="rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white disabled:opacity-60"
              >
                {saving ? text.saving : text.save}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
