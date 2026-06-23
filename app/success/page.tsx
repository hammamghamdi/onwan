"use client";

import { LanguageNav } from "@/app/components/LanguageNav";
import { createAddressShareMessage } from "@/lib/shareAddress";
import { useLanguage } from "@/lib/useLanguage";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { Suspense, useEffect, useRef, useState } from "react";

const copy = {
  ar: {
    title: "تم إنشاء عنوانك بنجاح",
    qrLabel: "رمز QR للعنوان العام",
    downloadQr: "تحميل QR",
    copied: "تم نسخ الرابط",
    copy: "نسخ الرابط",
    whatsapp: "مشاركة عبر واتساب",
    view: "عرض العنوان",
    edit: "تعديل العنوان",
  },
  en: {
    title: "Your address was created successfully",
    qrLabel: "QR code for public address",
    downloadQr: "Download QR",
    copied: "Link copied",
    copy: "Copy link",
    whatsapp: "Share on WhatsApp",
    view: "View address",
    edit: "Edit address",
  },
};

function SuccessContent() {
  const { language, setLanguage } = useLanguage();
  const text = copy[language];
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "";
  const ownerToken = searchParams.get("token") || "";

  useEffect(() => {
    if (!ownerToken || !name) return;

    localStorage.setItem(`onwan_owner_${name}`, ownerToken);
  }, [name, ownerToken]);

  const [copied, setCopied] = useState(false);
  const [qrReady, setQrReady] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const addressUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${name}`
      : `/${name}`;

  useEffect(() => {
    if (!qrCanvasRef.current || !addressUrl || !name) return;

    setQrReady(false);

    QRCode.toCanvas(qrCanvasRef.current, addressUrl, {
      width: 220,
      margin: 2,
      color: {
        dark: "#1f2d2b",
        light: "#ffffff",
      },
    })
      .then(() => setQrReady(true))
      .catch((error) => {
        console.log(error);
        setQrReady(false);
      });
  }, [addressUrl, name]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(createAddressShareMessage(addressUrl));
    setCopied(true);
  };

  const downloadQr = () => {
    if (!qrCanvasRef.current) return;

    const link = document.createElement("a");
    link.href = qrCanvasRef.current.toDataURL("image/png");
    link.download = `onwan-${name || "address"}-qr.png`;
    link.click();
  };

  const whatsappText = encodeURIComponent(createAddressShareMessage(addressUrl));

  return (
    <main
      dir={language === "en" ? "ltr" : "rtl"}
      className="min-h-screen bg-[#f7f8f5] px-4 py-10 text-black"
    >
      <LanguageNav language={language} setLanguage={setLanguage} />

      <div className="mx-auto max-w-sm rounded-3xl bg-white p-6 text-center shadow-sm">
        <h1 className="mb-6 text-3xl font-bold text-black">{text.title}</h1>

        <div className="mb-6 break-all rounded-2xl bg-gray-100 p-4 text-lg font-bold text-black">
          {addressUrl}
        </div>

        <div className="mb-4 rounded-2xl bg-gray-100 p-4">
          <canvas
            ref={qrCanvasRef}
            aria-label={text.qrLabel}
            className="mx-auto h-48 w-48 rounded-xl bg-white p-2"
          />
        </div>

        <button
          onClick={downloadQr}
          disabled={!qrReady}
          className="mb-4 w-full rounded-xl border border-[#006b4f] py-4 font-bold text-[#006b4f] disabled:opacity-60"
        >
          {text.downloadQr}
        </button>

        <button
          onClick={copyLink}
          className="mb-4 w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white"
        >
          {copied ? text.copied : text.copy}
        </button>

        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 block w-full rounded-xl bg-black py-4 font-bold text-white"
        >
          {text.whatsapp}
        </a>

        <Link
          href={`/${name}`}
          className="mb-4 block w-full rounded-xl border border-black py-4 font-bold text-black"
        >
          {text.view}
        </Link>

        <Link
          href={`/manage?name=${name}&token=${ownerToken}`}
          className="block w-full rounded-xl border border-[#006b4f] py-4 font-bold text-[#006b4f]"
        >
          {text.edit}
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
