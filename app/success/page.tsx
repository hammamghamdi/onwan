"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "";
  const ownerToken = searchParams.get("token") || "";

  useEffect(() => {
    if (!ownerToken || !name) return;

    localStorage.setItem(
      `onwan_owner_${name}`,
      ownerToken
    );
  }, [name, ownerToken]);

  const [copied, setCopied] = useState(false);

  const addressUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${name}`
      : `/${name}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(addressUrl);
    setCopied(true);
  };

  const whatsappText = encodeURIComponent(
    `هذا عنواني للوصول:\n${addressUrl}`
  );

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-4 py-10 text-black">
      <div className="mx-auto max-w-sm rounded-3xl bg-white p-6 text-center shadow-sm">
        <h1 className="mb-6 text-3xl font-bold text-black">
          تم إنشاء عنوانك بنجاح
        </h1>

        <div className="mb-6 break-all rounded-2xl bg-gray-100 p-4 text-lg font-bold text-black">
          {addressUrl}
        </div>

        <button
          onClick={copyLink}
          className="mb-4 w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white"
        >
          {copied ? "تم نسخ الرابط" : "نسخ الرابط"}
        </button>

        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 block w-full rounded-xl bg-black py-4 font-bold text-white"
        >
          مشاركة عبر واتساب
        </a>

        <Link
          href={`/${name}`}
          className="mb-4 block w-full rounded-xl border border-black py-4 font-bold text-black"
        >
          عرض العنوان
        </Link>

        <Link
          href={`/manage?name=${name}&token=${ownerToken}`}
          className="block w-full rounded-xl border border-[#006b4f] py-4 font-bold text-[#006b4f]"
        >
          تعديل العنوان
        </Link>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
