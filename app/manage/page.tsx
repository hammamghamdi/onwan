"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ManageProfile = {
  username: string;
  city: string | null;
  map_url: string | null;
  instructions_ar: string | null;
};

function ManageContent() {
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "";
  const tokenFromUrl = searchParams.get("token") || "";

  const [ownerToken, setOwnerToken] = useState("");
  const [city, setCity] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [canEdit, setCanEdit] = useState(false);

  const addressUrl =
    typeof window !== "undefined" && name
      ? `${window.location.origin}/${name}`
      : `/${name}`;

  const extractUrl = (text: string) => {
    return text.match(/https?:\/\/\S+/)?.[0]?.trim() || "";
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setMessage("");
      setCanEdit(false);

      if (!name) {
        setMessage("اسم العنوان غير موجود.");
        setLoading(false);
        return;
      }

      const storedToken = localStorage.getItem(`onwan_owner_${name}`) || "";
      const resolvedToken = tokenFromUrl || storedToken;

      if (!resolvedToken) {
        setMessage("رمز التعديل غير موجود.");
        setLoading(false);
        return;
      }

      setOwnerToken(resolvedToken);

      const { data, error } = await supabase
        .from("profiles")
        .select("username, city, map_url, instructions_ar")
        .eq("username", name)
        .eq("owner_token", resolvedToken)
        .maybeSingle<ManageProfile>();

      if (error || !data) {
        console.log(error);
        setMessage("الرابط غير صحيح أو لا تملك صلاحية التعديل.");
        setLoading(false);
        return;
      }

      localStorage.setItem(`onwan_owner_${name}`, resolvedToken);
      setCity(data.city || "");
      setMapUrl(data.map_url || "");
      setInstructions(data.instructions_ar || "");
      setCanEdit(true);
      setLoading(false);
    };

    loadProfile();
  }, [name, tokenFromUrl]);

  const saveChanges = async () => {
    const cleanedMapUrl = extractUrl(mapUrl);

    setMessage("");

    if (!canEdit || !ownerToken) {
      setMessage("لا يمكن تعديل هذا العنوان.");
      return;
    }

    if (!city.trim()) {
      setMessage("أدخل المدينة أو الحي.");
      return;
    }

    if (!mapUrl.trim()) {
      setMessage("أدخل رابط الخريطة.");
      return;
    }

    if (!cleanedMapUrl) {
      setMessage("لم يتم العثور على رابط صحيح. الصق رابط Google Maps.");
      return;
    }

    if (!instructions.trim()) {
      setMessage("أدخل تعليمات الوصول.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        city: city.trim(),
        map_url: cleanedMapUrl,
        instructions_ar: instructions.trim(),
        instructions_en: instructions.trim(),
        instructions_ur: instructions.trim(),
        instructions_bn: instructions.trim(),
      })
      .eq("username", name)
      .eq("owner_token", ownerToken);

    setSaving(false);

    if (error) {
      console.log(error);
      setMessage("حدث خطأ أثناء حفظ التعديلات.");
      return;
    }

    setMapUrl(cleanedMapUrl);
    setMessage("تم حفظ التعديلات بنجاح.");
  };

  const copyPublicLink = async () => {
    await navigator.clipboard.writeText(addressUrl);
    setCopied(true);
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-4 py-6 text-black">
      <div className="mx-auto max-w-sm rounded-3xl bg-white p-5 shadow-sm">
        <h1 className="mb-3 text-center text-2xl font-bold text-black">
          تعديل عنوانك
        </h1>

        <div className="mb-5 rounded-2xl bg-gray-100 p-4 text-center">
          <p className="mb-1 text-xs font-bold text-gray-500">عنوانك</p>
          <p dir="ltr" className="break-all text-lg font-bold text-black">
            {name ? `onwan.sa/${name}` : "غير محدد"}
          </p>
        </div>

        {loading && (
          <p className="mb-4 rounded-xl bg-gray-100 p-3 text-center font-bold text-gray-700">
            جاري تحميل العنوان...
          </p>
        )}

        {!loading && message && (
          <p
            className={`mb-4 rounded-xl p-3 text-center font-bold ${
              message.includes("بنجاح")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </p>
        )}

        {canEdit && (
          <>
            <label className="mb-2 block font-bold text-black">
              المدينة أو الحي
            </label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mb-4 w-full rounded-xl border p-4 text-black"
              placeholder="مثال: الرياض - حي الملقا"
            />

            <label className="mb-2 block font-bold text-black">
              رابط الخريطة
            </label>
            <input
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              className="mb-4 w-full rounded-xl border p-4 text-black"
              placeholder="الصق رابط Google Maps هنا"
            />

            <label className="mb-2 block font-bold text-black">
              تعليمات الوصول
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="mb-5 w-full rounded-xl border p-4 text-black"
              rows={4}
              placeholder="مثال: ادخل من البوابة الرئيسية، ثم اتجه يمينًا..."
            />

            <button
              onClick={saveChanges}
              disabled={saving}
              className="mb-3 w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>

            <Link
              href={`/${name}`}
              className="mb-3 block w-full rounded-xl border border-black py-4 text-center font-bold text-black"
            >
              عرض العنوان
            </Link>

            <button
              onClick={copyPublicLink}
              className="w-full rounded-xl bg-black py-4 font-bold text-white"
            >
              {copied ? "تم نسخ الرابط" : "نسخ رابط العنوان"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function ManagePage() {
  return (
    <Suspense>
      <ManageContent />
    </Suspense>
  );
}
