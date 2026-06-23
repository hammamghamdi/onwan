"use client";

import { createAddressShareMessage } from "@/lib/shareAddress";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams } from "next/navigation";
import { type KeyboardEvent, useEffect, useState } from "react";

type AddressData = {
  username: string;
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
    photoAlt: "صورة الوصول",
    close: "إغلاق",
    instructions: "تعليمات الوصول",
    noInstructions: "لم يتم إدخال تعليمات الوصول",
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
    photoAlt: "Access photo",
    close: "Close",
    instructions: "Access instructions",
    noInstructions: "No access instructions entered",
  },
};

export default function UserAddressPage() {
  const params = useParams();
  const user = params.user as string;

  const [address, setAddress] = useState<AddressData | null>(null);
  const [blockWarning, setBlockWarning] = useState<BlockWarning | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [language, setLanguage] = useState<PublicLanguage>("ar");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<number | null>(null);

  useEffect(() => {
    const loadAddress = async () => {
      const response = await fetch(
        `/api/public-address/${encodeURIComponent(user)}`,
        { cache: "no-store" }
      );
      const result = (await response.json()) as PublicAddressResponse;

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
    const publicUrl = `${window.location.origin}/${user}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      createAddressShareMessage(publicUrl)
    )}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
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

  const photos =
    address.photos && address.photos.length > 0
      ? address.photos
      : ([address.photo1, address.photo2, address.photo3]
          .filter(Boolean)
          .map((url) => ({
            url: url as string,
            caption: null,
          })) as AddressPhoto[]);

  const nextPhoto = () => {
    if (photos.length < 2) return;
    setCurrentPhoto((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    if (photos.length < 2) return;
    setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length);
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
            {address.username}
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
              <h2 className="text-lg font-bold text-black">{text.photos}</h2>

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
              className="overflow-hidden rounded-2xl bg-gray-100 touch-pan-y"
            >
              <img
                src={photos[currentPhoto].url}
                alt={`${text.photoAlt} ${currentPhoto + 1}`}
                draggable={false}
                onClick={() => setLightboxPhoto(currentPhoto)}
                className="h-64 w-full select-none rounded-2xl object-contain shadow-sm"
              />
            </div>

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
      </div>

      {lightboxPhoto !== null && photos[lightboxPhoto] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            type="button"
            aria-label={text.close}
            onClick={() => setLightboxPhoto(null)}
            className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl font-bold text-black"
          >
            ×
          </button>

          <div
            className="w-full max-w-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={photos[lightboxPhoto].url}
              alt={`${text.photoAlt} ${lightboxPhoto + 1}`}
              className="max-h-[82vh] w-full rounded-2xl object-contain shadow-2xl"
            />

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
