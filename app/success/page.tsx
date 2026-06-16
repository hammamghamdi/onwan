"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "";
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
        <h1 className="mb-4 text-3xl font-bold text-black">
          تم إنشاء عنوانك بنجاح
        </h1>

        <p className="mb-6 text-black">
          يمكنك الآن نسخ الرابط أو مشاركته مباشرة.
        </p>

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
          className="block w-full rounded-xl border border-black py-4 font-bold text-black"
        >
          عرض العنوان
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