"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AddressData = {
  username: string;
  city: string | null;
  map_url: string | null;
  photo1: string | null;
  photo2: string | null;
  photo3: string | null;
  instructions_ar: string | null;
  instructions_en: string | null;
  instructions_ur: string | null;
  instructions_bn: string | null;
};

type PublicLanguage = "ar" | "en" | "ur" | "bn";

const languageOptions: { code: PublicLanguage; label: string }[] = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
  { code: "ur", label: "اردو" },
  { code: "bn", label: "বাংলা" },
];

const copy = {
  ar: {
    loading: "جاري تحميل العنوان...",
    notFoundTitle: "العنوان غير موجود",
    notFoundBody: "هذا العنوان لم يتم حجزه بعد أو أن الرابط غير صحيح.",
    noCity: "لم يتم إدخال المدينة",
    mapCta: "افتح في الخرائط",
    photos: "صور الوصول",
    photoAlt: "صورة الوصول",
    previous: "السابق",
    next: "التالي",
    instructions: "تعليمات الوصول",
    noInstructions: "لم يتم إدخال تعليمات الوصول",
    createAddress: "أنشئ عنوانك الآن",
  },
  en: {
    loading: "Loading address...",
    notFoundTitle: "Address not found",
    notFoundBody: "This address has not been reserved yet or the link is incorrect.",
    noCity: "No city entered",
    mapCta: "Open in Maps",
    photos: "Access Photos",
    photoAlt: "Access photo",
    previous: "Previous",
    next: "Next",
    instructions: "Access Instructions",
    noInstructions: "No access instructions entered",
    createAddress: "Create your address now",
  },
  ur: {
    loading: "عنوان لوڈ ہو رہا ہے...",
    notFoundTitle: "عنوان موجود نہیں",
    notFoundBody: "یہ عنوان ابھی محفوظ نہیں کیا گیا یا لنک درست نہیں ہے۔",
    noCity: "شہر درج نہیں کیا گیا",
    mapCta: "نقشہ کھولیں",
    photos: "رسائی کی تصاویر",
    photoAlt: "رسائی کی تصویر",
    previous: "پچھلا",
    next: "اگلا",
    instructions: "رسائی کی ہدایات",
    noInstructions: "رسائی کی ہدایات درج نہیں کی گئیں",
    createAddress: "اپنا عنوان ابھی بنائیں",
  },
  bn: {
    loading: "ঠিকানা লোড হচ্ছে...",
    notFoundTitle: "ঠিকানা পাওয়া যায়নি",
    notFoundBody: "এই ঠিকানাটি এখনো সংরক্ষিত হয়নি অথবা লিংকটি সঠিক নয়।",
    noCity: "শহর দেওয়া হয়নি",
    mapCta: "ম্যাপে খুলুন",
    photos: "পৌঁছানোর ছবি",
    photoAlt: "পৌঁছানোর ছবি",
    previous: "আগের",
    next: "পরের",
    instructions: "পৌঁছানোর নির্দেশনা",
    noInstructions: "পৌঁছানোর নির্দেশনা দেওয়া হয়নি",
    createAddress: "এখন আপনার ঠিকানা তৈরি করুন",
  },
} satisfies Record<PublicLanguage, Record<string, string>>;

const isLtr = (language: PublicLanguage) => language === "en" || language === "bn";

export default function UserAddressPage() {
  const params = useParams();
  const user = params.user as string;

  const [address, setAddress] = useState<AddressData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [language, setLanguage] = useState<PublicLanguage>("ar");

  useEffect(() => {
    const loadAddress = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "username, city, map_url, photo1, photo2, photo3, instructions_ar, instructions_en, instructions_ur, instructions_bn"
        )
        .eq("username", user)
        .single();

      if (error) {
        console.log(error);
        setAddress(null);
      } else {
        setAddress(data);

        const storageKey = `onwan_address_${user}`;
        let visitorId = localStorage.getItem(storageKey);
        let isUnique = false;

        if (!visitorId) {
          visitorId = crypto.randomUUID();
          localStorage.setItem(storageKey, visitorId);
          isUnique = true;
        }

        await supabase.from("address_visits").insert({
          username: user,
          visitor_id: visitorId,
          is_unique: isUnique,
        });
      }

      setLoaded(true);
    };

    loadAddress();
  }, [user]);

  const text = copy[language];
  const pageDirection = isLtr(language) ? "ltr" : "rtl";

  const languageSwitcher = (
    <div className="mb-3 flex flex-wrap items-center justify-center gap-2 rounded-3xl bg-white p-3 text-sm font-bold shadow-sm">
      {languageOptions.map((option, index) => (
        <div key={option.code} className="flex items-center gap-2">
          {index > 0 && <span className="text-gray-300">|</span>}
          <button
            type="button"
            onClick={() => setLanguage(option.code)}
            className={
              option.code === language
                ? "text-[#006b4f]"
                : "text-black hover:text-[#006b4f]"
            }
          >
            {option.label}
          </button>
        </div>
      ))}
    </div>
  );

  if (!loaded) {
    return (
      <main
        dir={pageDirection}
        className="min-h-screen bg-[#f7f8f5] px-3 py-4 text-black"
      >
        <div className="mx-auto w-full max-w-sm">
          {languageSwitcher}
          <div className="rounded-3xl bg-white p-5 text-center shadow-sm">
            {text.loading}
          </div>
        </div>
      </main>
    );
  }

  if (!address) {
    return (
      <main
        dir={pageDirection}
        className="min-h-screen bg-[#f7f8f5] px-3 py-4 text-black"
      >
        <div className="mx-auto w-full max-w-sm">
          {languageSwitcher}
          <div className="rounded-3xl bg-white p-5 text-center shadow-sm">
            <h1 className="mb-3 text-2xl font-bold text-black">
              {text.notFoundTitle}
            </h1>
            <p className="text-black">{text.notFoundBody}</p>
          </div>
        </div>
      </main>
    );
  }

  const photos = [address.photo1, address.photo2, address.photo3].filter(
    Boolean
  ) as string[];

  const instructionsByLanguage: Record<PublicLanguage, string | null> = {
    ar: address.instructions_ar,
    en: address.instructions_en,
    ur: address.instructions_ur,
    bn: address.instructions_bn,
  };

  const selectedInstructionLanguage = instructionsByLanguage[language]?.trim()
    ? language
    : address.instructions_ar?.trim()
      ? "ar"
      : address.instructions_en?.trim()
        ? "en"
        : language;
  const selectedInstructions =
    instructionsByLanguage[language]?.trim() ||
    address.instructions_ar?.trim() ||
    address.instructions_en?.trim() ||
    text.noInstructions;
  const instructionsDirection = isLtr(selectedInstructionLanguage)
    ? "ltr"
    : "rtl";

  const nextPhoto = () => {
    setCurrentPhoto((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <main
      dir={pageDirection}
      className="min-h-screen bg-[#f7f8f5] px-3 py-3 text-black"
    >
      <div className="mx-auto w-full max-w-sm">
        {languageSwitcher}

        <section className="mb-3 rounded-3xl bg-white p-4 shadow-sm">
          <h1 className="mb-3 text-center text-2xl font-bold text-black">
            {address.username}
          </h1>

          <div className="px-1 py-3 text-base font-bold text-black">
            {address.city || text.noCity}
          </div>

          {address.map_url && (
            <a
              href={address.map_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block w-full rounded-2xl bg-[#006b4f] px-5 py-4 text-center text-base font-bold text-white shadow-sm"
            >
              {text.mapCta}
            </a>
          )}
        </section>

        {photos.length > 0 && (
          <section className="mb-3 rounded-3xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-black">{text.photos}</h2>

              <span className="text-sm font-bold text-black">
                {currentPhoto + 1} / {photos.length}
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl bg-gray-100">
              <img
                src={photos[currentPhoto]}
                alt={`${text.photoAlt} ${currentPhoto + 1}`}
                className="h-64 w-full object-contain"
              />
            </div>

            {photos.length > 1 && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevPhoto}
                  className="flex-1 rounded-xl border border-black py-3 text-sm font-bold text-black"
                >
                  {text.previous}
                </button>

                <button
                  type="button"
                  onClick={nextPhoto}
                  className="flex-1 rounded-xl border border-black py-3 text-sm font-bold text-black"
                >
                  {text.next}
                </button>
              </div>
            )}
          </section>
        )}

        <section className="mb-3 rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-black">
            {text.instructions}
          </h2>

          <p
            dir={instructionsDirection}
            className="whitespace-pre-line text-base leading-7 text-black"
          >
            {selectedInstructions}
          </p>
        </section>

        <Link
          href="/"
          className="mb-3 block w-full rounded-3xl bg-black py-5 text-center text-lg font-bold text-white shadow-sm"
        >
          {text.createAddress}
        </Link>
      </div>
    </main>
  );
}
