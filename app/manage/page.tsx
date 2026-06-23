"use client";

import { LanguageNav } from "@/app/components/LanguageNav";
import { createAddressShareMessage } from "@/lib/shareAddress";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/useLanguage";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type ManageProfile = {
  username: string;
  city: string | null;
  map_url: string | null;
  instructions_ar: string | null;
};

const copy = {
  ar: {
    title: "تعديل عنوانك",
    addressLabel: "عنوانك",
    unnamed: "غير محدد",
    loading: "جاري تحميل العنوان...",
    missingName: "اسم العنوان غير موجود.",
    missingToken: "رمز التعديل غير موجود.",
    invalidAccess: "الرابط غير صحيح أو لا تملك صلاحية التعديل.",
    cannotEdit: "لا يمكن تعديل هذا العنوان.",
    cityRequired: "أدخل المدينة أو الحي.",
    mapRequired: "أدخل رابط الخريطة.",
    invalidMap: "لم يتم العثور على رابط صحيح. الصق رابط Google Maps.",
    instructionsRequired: "أدخل تعليمات الوصول.",
    saveError: "حدث خطأ أثناء حفظ التعديلات.",
    saveSuccess: "تم حفظ التعديلات بنجاح.",
    cityLabel: "المدينة أو الحي",
    cityPlaceholder: "مثال: الرياض - حي الملقا",
    mapLabel: "رابط الخريطة",
    mapPlaceholder: "الصق رابط Google Maps هنا",
    instructionsLabel: "تعليمات الوصول",
    instructionsPlaceholder:
      "مثال: ادخل من البوابة الرئيسية، ثم اتجه يمينًا...",
    saving: "جاري الحفظ...",
    save: "حفظ التعديلات",
    view: "عرض العنوان",
    copied: "تم نسخ الرابط",
    copy: "نسخ رابط العنوان",
  },
  en: {
    title: "Edit your address",
    addressLabel: "Your address",
    unnamed: "Not specified",
    loading: "Loading address...",
    missingName: "Address name is missing.",
    missingToken: "Edit token is missing.",
    invalidAccess: "This link is invalid or you do not have edit access.",
    cannotEdit: "This address cannot be edited.",
    cityRequired: "Enter the city or district.",
    mapRequired: "Enter the map link.",
    invalidMap: "No valid link was found. Paste a Google Maps link.",
    instructionsRequired: "Enter arrival instructions.",
    saveError: "An error occurred while saving changes.",
    saveSuccess: "Changes saved successfully.",
    cityLabel: "City or district",
    cityPlaceholder: "Example: Riyadh - Al Malqa",
    mapLabel: "Map link",
    mapPlaceholder: "Paste the Google Maps link here",
    instructionsLabel: "Arrival instructions",
    instructionsPlaceholder:
      "Example: Enter from the main gate, then turn right...",
    saving: "Saving...",
    save: "Save changes",
    view: "View address",
    copied: "Link copied",
    copy: "Copy address link",
  },
};

function ManageContent() {
  const { language, setLanguage } = useLanguage();
  const text = copy[language];
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
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);

  const addressUrl =
    typeof window !== "undefined" && name
      ? `${window.location.origin}/${name}`
      : `/${name}`;

  const extractUrl = (value: string) => {
    return value.match(/https?:\/\/\S+/)?.[0]?.trim() || "";
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setMessage("");
      setIsSuccessMessage(false);
      setCanEdit(false);

      if (!name) {
        setMessage(text.missingName);
        setLoading(false);
        return;
      }

      const storedToken = localStorage.getItem(`onwan_owner_${name}`) || "";
      const resolvedToken = tokenFromUrl || storedToken;

      if (!resolvedToken) {
        setMessage(text.missingToken);
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
        setMessage(text.invalidAccess);
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
  }, [name, tokenFromUrl, text.invalidAccess, text.missingName, text.missingToken]);

  const saveChanges = async () => {
    const cleanedMapUrl = extractUrl(mapUrl);

    setMessage("");
    setIsSuccessMessage(false);

    if (!canEdit || !ownerToken) {
      setMessage(text.cannotEdit);
      return;
    }

    if (!city.trim()) {
      setMessage(text.cityRequired);
      return;
    }

    if (!mapUrl.trim()) {
      setMessage(text.mapRequired);
      return;
    }

    if (!cleanedMapUrl) {
      setMessage(text.invalidMap);
      return;
    }

    if (!instructions.trim()) {
      setMessage(text.instructionsRequired);
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
      setMessage(text.saveError);
      return;
    }

    setMapUrl(cleanedMapUrl);
    setIsSuccessMessage(true);
    setMessage(text.saveSuccess);
  };

  const copyPublicLink = async () => {
    await navigator.clipboard.writeText(createAddressShareMessage(addressUrl));
    setCopied(true);
  };

  return (
    <main
      dir={language === "en" ? "ltr" : "rtl"}
      className="min-h-screen bg-[#f7f8f5] px-4 py-6 text-black"
    >
      <LanguageNav language={language} setLanguage={setLanguage} />

      <div className="mx-auto max-w-sm rounded-3xl bg-white p-5 shadow-sm">
        <h1 className="mb-3 text-center text-2xl font-bold text-black">
          {text.title}
        </h1>

        <div className="mb-5 rounded-2xl bg-gray-100 p-4 text-center">
          <p className="mb-1 text-xs font-bold text-gray-500">
            {text.addressLabel}
          </p>
          <p dir="ltr" className="break-all text-lg font-bold text-black">
            {name ? `onwan.sa/${name}` : text.unnamed}
          </p>
        </div>

        {loading && (
          <p className="mb-4 rounded-xl bg-gray-100 p-3 text-center font-bold text-gray-700">
            {text.loading}
          </p>
        )}

        {!loading && message && (
          <p
            className={`mb-4 rounded-xl p-3 text-center font-bold ${
              isSuccessMessage
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
              {text.cityLabel}
            </label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mb-4 w-full rounded-xl border p-4 text-black"
              placeholder={text.cityPlaceholder}
            />

            <label className="mb-2 block font-bold text-black">
              {text.mapLabel}
            </label>
            <input
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              className="mb-4 w-full rounded-xl border p-4 text-black"
              placeholder={text.mapPlaceholder}
            />

            <label className="mb-2 block font-bold text-black">
              {text.instructionsLabel}
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="mb-5 w-full rounded-xl border p-4 text-black"
              rows={4}
              placeholder={text.instructionsPlaceholder}
            />

            <button
              onClick={saveChanges}
              disabled={saving}
              className="mb-3 w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white disabled:opacity-60"
            >
              {saving ? text.saving : text.save}
            </button>

            <Link
              href={`/${name}`}
              className="mb-3 block w-full rounded-xl border border-black py-4 text-center font-bold text-black"
            >
              {text.view}
            </Link>

            <button
              onClick={copyPublicLink}
              className="w-full rounded-xl bg-black py-4 font-bold text-white"
            >
              {copied ? text.copied : text.copy}
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
