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

export default function UserAddressPage() {
  const params = useParams();
  const user = params.user as string;

  const [address, setAddress] = useState<AddressData | null>(null);
  const [blockWarning, setBlockWarning] = useState<BlockWarning | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);

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

  if (!loaded) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-3 py-4 text-black">
        <div className="mx-auto max-w-sm rounded-3xl bg-white p-5 text-center shadow-sm">
          جاري تحميل العنوان...
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
      <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-3 py-4 text-black">
        <div className="mx-auto max-w-sm rounded-3xl bg-white p-5 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-bold text-black">
            العنوان غير موجود
          </h1>
          <p className="text-black">
            هذا العنوان لم يتم حجزه بعد أو أن الرابط غير صحيح.
          </p>
        </div>
      </main>
    );
  }

  const photos = [address.photo1, address.photo2, address.photo3].filter(
    Boolean
  ) as string[];

  const nextPhoto = () => {
    setCurrentPhoto((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-3 py-3 text-black">
      <div className="mx-auto w-full max-w-sm">
        <section className="mb-3 rounded-3xl bg-white p-4 shadow-sm">
          <h1 className="mb-3 text-center text-2xl font-bold text-black">
            {address.username}
          </h1>

          <div className="flex items-center gap-2">
            <div className="flex-1 px-1 py-3 text-base font-bold text-black">
              {address.city || "لم يتم إدخال المدينة"}
            </div>

            {address.map_url && (
              <a
                href={address.map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-[#006b4f] px-4 py-3 text-sm font-bold text-white"
              >
                الخريطة
              </a>
            )}
          </div>
        </section>

        {photos.length > 0 && (
          <section className="mb-3 rounded-3xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-black">صور الوصول</h2>

              <span className="text-sm font-bold text-black">
                {currentPhoto + 1} / {photos.length}
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl bg-gray-100">
              <img
                src={photos[currentPhoto]}
                alt={`صورة الوصول ${currentPhoto + 1}`}
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
                  السابق
                </button>

                <button
                  type="button"
                  onClick={nextPhoto}
                  className="flex-1 rounded-xl border border-black py-3 text-sm font-bold text-black"
                >
                  التالي
                </button>
              </div>
            )}
          </section>
        )}

        <section className="mb-3 rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-black">
            تعليمات الوصول
          </h2>

          <div className="space-y-2 text-base leading-7 text-black">
            <p>{address.instructions_ar || "لم يتم إدخال تعليمات الوصول"}</p>

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

        <Link
          href="/"
          className="mb-3 block w-full rounded-3xl bg-black py-5 text-center text-lg font-bold text-white shadow-sm"
        >
          أنشئ عنوانك الآن
        </Link>
      </div>
    </main>
  );
}
