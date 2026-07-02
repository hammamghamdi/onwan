"use client";

import { createPublicAddressUrl } from "@/lib/appUrl";
import { createAddressShareMessage } from "@/lib/shareAddress";
import { supabase } from "@/lib/supabase";
import { normalizeUsername } from "@/lib/username";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { type KeyboardEvent, useEffect, useState } from "react";

type AddressData = {
  username: string;
  display_username: string | null;
  city: string | null;
  map_url: string | null;
  photo1: string | null;
  photo2: string | null;
  photo3: string | null;
  photos?: AddressPhoto[];
  instructions_ar: string | null;
  instructions_en: string | null;
  instructions_ur: string | null;
  instructions_bn: string | null;
  is_suspended?: boolean;
};

type AddressPhoto = {
  url: string;
  caption: string | null;
};

type BlockWarning = {
  ar: string;
  en: string;
  ur: string;
  bn: string;
};

type PublicAddressResponse =
  | {
      status: "ok";
      address: AddressData;
    }
  | {
      status: "blocked";
      warning: BlockWarning;
    }
  | {
      status: "not_found" | "error";
      message?: string;
    };

type PublicLanguage = "ar" | "en";

const copy = {
  ar: {
    home: "الصفحة الرئيسية",
    share: "مشاركة العنوان",
    toggleLabel: "التبديل إلى الإنجليزية",
    toggleText: "En",
    loading: "جاري تحميل العنوان...",
    notFoundTitle: "العنوان غير موجود",
    notFoundBody: "هذا العنوان لم يتم حجزه بعد أو أن الرابط غير صحيح.",
    noCity: "لم يتم إدخال المدينة",
    map: "الخريطة",
    photos: "صور الوصول",
    enlargeHint: "انقر على الصورة لتكبيرها",
    photoAlt: "صورة الوصول",
    close: "إغلاق",
    instructions: "تعليمات الوصول",
    noInstructions: "لم يتم إدخال تعليمات الوصول",
    report: "الإبلاغ عن إساءة استخدام",
    reportDetails: "تفاصيل البلاغ",
    reportPlaceholder: "اكتب سبب البلاغ باختصار",
    reportSubmit: "إرسال البلاغ",
    reportSubmitting: "جاري الإرسال...",
    reportSuccess: "تم استلام البلاغ. شكرًا لك.",
    reportError: "تعذر إرسال البلاغ. حاول مرة أخرى.",
    suspended: "هذا العنوان غير متاح حاليًا.",
  },
  en: {
    home: "Home",
    share: "Share address",
    toggleLabel: "Switch to Arabic",
    toggleText: "ع",
    loading: "Loading address...",
    notFoundTitle: "Address not found",
    notFoundBody: "This address has not been reserved yet or the link is incorrect.",
    noCity: "No city entered",
    map: "Map",
    photos: "Access photos",
    enlargeHint: "Tap to enlarge photo",
    photoAlt: "Access photo",
    close: "Close",
    instructions: "Access instructions",
    noInstructions: "No access instructions entered",
    report: "Report misuse",
    reportDetails: "Report details",
    reportPlaceholder: "Briefly describe the issue",
    reportSubmit: "Submit report",
    reportSubmitting: "Submitting...",
    reportSuccess: "Report received. Thank you.",
    reportError: "Could not submit the report. Try again.",
    suspended: "This address is currently unavailable.",
  },
};

export default function UserAddressPage() {
  const params = useParams();
  const user = normalizeUsername(params.user as string);

  const [address, setAddress] = useState<AddressData | null>(null);
  const [blockWarning, setBlockWarning] = useState<BlockWarning | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [language, setLanguage] = useState<PublicLanguage>("ar");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<number | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDetails, setReportDetails] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    const loadAddress = async () => {
      const startedAt = performance.now();
      const response = await fetch(
        `/api/public-address/${encodeURIComponent(user)}`,
        { cache: "no-store" }
      );
      const result = (await response.json()) as PublicAddressResponse;

      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[public-address-page] base fetch: ${Math.round(
            performance.now() - startedAt
          )}ms`
        );
      }

      if (result.status === "blocked") {
        setBlockWarning(result.warning);
        setAddress(null);
      } else if (result.status !== "ok") {
        console.log(result.message || result.status);
        setBlockWarning(null);
        setAddress(null);
      } else {
        setBlockWarning(null);
        setAddress(result.address);
        setLoaded(true);

        const storageKey = `onwan_address_${user}`;
        let visitorId = localStorage.getItem(storageKey);
        let isUnique = false;

        if (!visitorId) {
          visitorId = crypto.randomUUID();
          localStorage.setItem(storageKey, visitorId);
          isUnique = true;
        }

        supabase
          .from("address_visits")
          .insert({
            username: user,
            visitor_id: visitorId,
            is_unique: isUnique,
          })
          .then(({ error }) => {
            if (error) console.log(error);
          });

        fetch(`/api/public-address/${encodeURIComponent(user)}?photos=1`, {
          cache: "no-store",
        })
          .then((photoResponse) => photoResponse.json())
          .then((photoResult: PublicAddressResponse) => {
            if (photoResult.status === "ok") {
              setAddress(photoResult.address);
            }
          })
          .catch((error) => console.log(error));

        return;
      }

      setLoaded(true);
    };

    loadAddress();
  }, [user]);

  useEffect(() => {
    if (lightboxPhoto === null) return;

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxPhoto(null);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [lightboxPhoto]);

  const text = copy[language];
  const pageDirection = language === "en" ? "ltr" : "rtl";

  const shareOnWhatsApp = () => {
    const publicUrl = createPublicAddressUrl(
      address?.display_username || address?.username || user
    );
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      createAddressShareMessage(publicUrl)
    )}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const submitReport = async () => {
    if (!address || reportSubmitting) return;

    setReportSubmitting(true);
    setReportMessage("");

    const reportedUrl = createPublicAddressUrl(
      address.display_username || address.username
    );

    const { error } = await supabase.from("abuse_reports").insert({
      reported_username: address.username,
      reported_url: reportedUrl,
      reason: "abuse",
      details: reportDetails.trim() || null,
    });

    setReportSubmitting(false);

    if (error) {
      console.log(error);
      setReportMessage(text.reportError);
      return;
    }

    setReportDetails("");
    setReportMessage(text.reportSuccess);
  };

  const header = (
    <nav dir="rtl" className="mb-3 flex items-center justify-between py-3 text-sm">
      <Link
        href="/"
        className="rounded-full border border-[#006b4f] px-4 py-2 font-semibold text-[#006b4f]"
      >
        {text.home}
      </Link>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={shareOnWhatsApp}
          className="rounded-full bg-[#006b4f] px-4 py-2 font-semibold text-white"
        >
          {text.share}
        </button>

        <button
          type="button"
          aria-label={text.toggleLabel}
          onClick={() => setLanguage((current) => (current === "ar" ? "en" : "ar"))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#006b4f] bg-white text-xs font-black text-[#006b4f]"
        >
          {text.toggleText}
        </button>
      </div>
    </nav>
  );

  if (!loaded) {
    return (
      <main
        dir={pageDirection}
        className="min-h-screen bg-[#f7f8f5] px-3 py-3 text-black"
      >
        <div className="mx-auto w-full max-w-sm">
          {header}
          <div className="rounded-3xl bg-white p-5 text-center shadow-sm">
            {text.loading}
          </div>
        </div>
      </main>
    );
  }

  if (blockWarning) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-3 py-4 text-black">
        <div className="mx-auto max-w-sm rounded-3xl bg-white p-5 shadow-sm">
          <div className="space-y-4 text-sm font-bold leading-7 text-black">
            <p>{blockWarning.ar}</p>
            <p dir="ltr">{blockWarning.en}</p>
            <p dir="rtl">{blockWarning.ur}</p>
            <p dir="ltr">{blockWarning.bn}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!address) {
    return (
      <main
        dir={pageDirection}
        className="min-h-screen bg-[#f7f8f5] px-3 py-3 text-black"
      >
        <div className="mx-auto w-full max-w-sm">
          {header}
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

  if (address.is_suspended) {
    return (
      <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f7f8f5] px-4 text-black">
        <p className="text-center text-xl font-bold">
          هذا العنوان غير متاح حاليًا.
        </p>
      </main>
    );
  }

  const photos =
    address.photos && address.photos.length > 0
      ? address.photos
      : ([address.photo1, address.photo2, address.photo3]
          .filter(Boolean)
          .map((url) => ({
            url: url as string,
            caption: null,
          })) as AddressPhoto[]);

  const showPhoto = (index: number) => {
    if (photos.length === 0) return;

    const nextIndex = (index + photos.length) % photos.length;
    setCurrentPhoto(nextIndex);
    setLightboxPhoto((current) => (current === null ? null : nextIndex));
  };

  const nextPhoto = () => {
    if (photos.length < 2) return;
    showPhoto(currentPhoto + 1);
  };

  const prevPhoto = () => {
    if (photos.length < 2) return;
    showPhoto(currentPhoto - 1);
  };

  const handlePhotoTouchEnd = (clientX: number) => {
    if (touchStartX === null || photos.length < 2) return;

    const distance = touchStartX - clientX;

    if (Math.abs(distance) > 40) {
      if (distance > 0) {
        nextPhoto();
      } else {
        prevPhoto();
      }
    }

    setTouchStartX(null);
  };

  const handlePhotoKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      nextPhoto();
    }

    if (event.key === "ArrowRight") {
      prevPhoto();
    }
  };

  return (
    <main
      dir={pageDirection}
      className="min-h-screen bg-[#f7f8f5] px-3 py-3 text-black"
    >
      <div className="mx-auto w-full max-w-sm">
        {header}

        <section className="mb-3 rounded-3xl bg-white p-4 shadow-sm">
          <h1 className="mb-3 text-center text-2xl font-bold text-black">
            {address.display_username || address.username}
          </h1>

          <div className="flex items-center gap-2">
            <div className="flex-1 px-1 py-3 text-base font-bold text-black">
              {address.city || text.noCity}
            </div>

            {address.map_url && (
              <a
                href={address.map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-[#006b4f] px-4 py-3 text-sm font-bold text-white"
              >
                {text.map}
              </a>
            )}
          </div>
        </section>

        {photos.length > 0 && (
          <section className="mb-3 rounded-3xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[#006b4f]">
                {text.enlargeHint}
              </p>

              <span className="text-sm font-bold text-black">
                {currentPhoto + 1} / {photos.length}
              </span>
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-label={text.photos}
              onKeyDown={handlePhotoKeyDown}
              onTouchStart={(event) =>
                setTouchStartX(event.touches[0]?.clientX ?? null)
              }
              onTouchEnd={(event) =>
                handlePhotoTouchEnd(event.changedTouches[0]?.clientX ?? 0)
              }
              onTouchCancel={() => setTouchStartX(null)}
              className="relative h-64 w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm touch-pan-y"
            >
              <Image
                src={photos[currentPhoto].url}
                alt={`${text.photoAlt} ${currentPhoto + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 384px"
                priority={currentPhoto === 0}
                draggable={false}
                onClick={() => setLightboxPhoto(currentPhoto)}
                className="select-none rounded-2xl object-contain"
              />
            </div>

            {photos.length > 1 && (
              <div
                className="mt-3 flex gap-2 overflow-x-auto pb-1"
                aria-label={text.photos}
              >
                {photos.map((photo, index) => (
                  <button
                    key={`${photo.url}-${index}`}
                    type="button"
                    onClick={() => showPhoto(index)}
                    aria-current={currentPhoto === index ? "true" : undefined}
                    aria-label={`${text.photoAlt} ${index + 1}`}
                    className={`relative h-16 w-16 flex-none overflow-hidden rounded-xl border-2 bg-gray-100 ${
                      currentPhoto === index
                        ? "border-[#006b4f]"
                        : "border-transparent"
                    }`}
                  >
                    <Image
                      src={photo.url}
                      alt={`${text.photoAlt} ${index + 1}`}
                      fill
                      sizes="64px"
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {photos[currentPhoto].caption && (
              <p className="mt-3 text-center text-sm leading-6 text-gray-700">
                {photos[currentPhoto].caption}
              </p>
            )}
          </section>
        )}

        <section className="mb-3 rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-black">
            {text.instructions}
          </h2>

          <div className="space-y-2 text-base leading-7 text-black">
            <p>{address.instructions_ar || text.noInstructions}</p>

            {address.instructions_en &&
              address.instructions_en !== address.instructions_ar && (
                <p dir="ltr">{address.instructions_en}</p>
              )}

            {address.instructions_ur &&
              address.instructions_ur !== address.instructions_ar && (
                <p dir="rtl">{address.instructions_ur}</p>
              )}

            {address.instructions_bn &&
              address.instructions_bn !== address.instructions_ar && (
                <p dir="ltr">{address.instructions_bn}</p>
            )}
          </div>
        </section>

        <section className="min-w-0 max-w-full overflow-hidden pb-5 text-center text-sm">
          {!reportOpen && !reportMessage && (
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="font-bold text-gray-500 underline underline-offset-4"
            >
              {text.report}
            </button>
          )}

          {reportOpen && (
            <div className="w-full max-w-full rounded-2xl bg-white p-4 text-right shadow-sm">
              <label className="mb-2 block font-bold text-black">
                {text.reportDetails}
              </label>
              <textarea
                value={reportDetails}
                onChange={(event) => {
                  setReportDetails(event.target.value);
                  setReportMessage("");
                }}
                rows={3}
                className="mb-3 w-full max-w-full rounded-xl border p-3 text-base text-black"
                placeholder={text.reportPlaceholder}
              />
              <button
                type="button"
                onClick={submitReport}
                disabled={reportSubmitting}
                className="w-full rounded-xl bg-[#006b4f] py-3 font-bold text-white disabled:opacity-60"
              >
                {reportSubmitting ? text.reportSubmitting : text.reportSubmit}
              </button>
            </div>
          )}

          {reportMessage && (
            <p className="mt-3 max-w-full break-words rounded-xl bg-white p-3 font-bold text-[#006b4f] shadow-sm">
              {reportMessage}
            </p>
          )}
        </section>
      </div>

      {lightboxPhoto !== null && photos[lightboxPhoto] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightboxPhoto(null)}
          onTouchStart={(event) =>
            setTouchStartX(event.touches[0]?.clientX ?? null)
          }
          onTouchEnd={(event) =>
            handlePhotoTouchEnd(event.changedTouches[0]?.clientX ?? 0)
          }
          onTouchCancel={() => setTouchStartX(null)}
        >
          <button
            type="button"
            aria-label={text.close}
            onClick={() => setLightboxPhoto(null)}
            className="absolute end-3 top-3 z-20 flex h-16 w-16 items-center justify-center rounded-full text-black"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-xl font-bold shadow-lg">
              x
            </span>
          </button>

          <div
            className="relative z-0 w-full max-w-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-[82vh] w-full">
              <Image
                src={photos[lightboxPhoto].url}
                alt={`${text.photoAlt} ${lightboxPhoto + 1}`}
                fill
                sizes="100vw"
                className="rounded-2xl object-contain shadow-2xl"
              />
            </div>

            {photos[lightboxPhoto].caption && (
              <p className="mt-4 text-center text-sm leading-6 text-white">
                {photos[lightboxPhoto].caption}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
