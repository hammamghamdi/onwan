"use client";

import { LanguageNav } from "@/app/components/LanguageNav";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/useLanguage";
import Link from "next/link";
import { useState } from "react";

const reservedNames = [
  "admin",
  "administrator",
  "support",
  "help",
  "contact",
  "login",
  "register",
  "setup",
  "success",
  "manage",
  "api",
  "dashboard",
  "onwan",
  "official",
  "verified",
  "gov",
  "government",
  "saudi",
  "ksa",
  "moi",
  "moe",
  "moh",
  "absher",
  "nafath",
  "najiz",
  "etimad",
  "balady",
  "zakat",
  "zatca",
  "police",
  "airport",
  "riyadh",
  "jeddah",
  "makkah",
  "madinah",
  "mecca",
  "medina",
  "kaaba",
  "haram",
];

const copy = {
  ar: {
    missingName: "اكتب اسم العنوان أولًا.",
    tooShort: "اسم العنوان يجب أن يكون 5 خانات على الأقل.",
    needsLetter:
      "اسم العنوان يجب أن يحتوي على حرف إنجليزي واحد على الأقل.",
    reserved: "هذا الاسم غير متاح للاستخدام.",
    checkError: "حدث خطأ أثناء التحقق. حاول مرة أخرى.",
    title: "اختر اسم عنوانك",
    usernameLabel: "اسم العنوان",
    usernamePlaceholder: "مثال: abdullah",
    helper:
      "اختر اسمًا سهلًا تقدر تشاركه مع الآخرين. الحروف الإنجليزية والأرقام فقط، والحد الأدنى 5 خانات.",
    checking: "جاري التحقق...",
    check: "تحقق من التوفر",
    available: "هذا العنوان متاح",
    reserve: "احجز هذا العنوان",
    unavailable: "هذا العنوان محجوز",
  },
  en: {
    missingName: "Enter an address name first.",
    tooShort: "Address name must be at least 5 characters.",
    needsLetter: "Address name must include at least one English letter.",
    reserved: "This name is not available for use.",
    checkError: "An error occurred while checking. Try again.",
    title: "Choose your address name",
    usernameLabel: "Address name",
    usernamePlaceholder: "Example: abdullah",
    helper:
      "Choose an easy name you can share with others. English letters and numbers only, minimum 5 characters.",
    checking: "Checking...",
    check: "Check availability",
    available: "This address is available",
    reserve: "Reserve this address",
    unavailable: "This address is reserved",
  },
};

export default function RegisterPage() {
  const { language, setLanguage } = useLanguage();
  const text = copy[language];
  const [username, setUsername] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [checking, setChecking] = useState(false);

  const cleanUsername = (value: string) => {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  const checkAvailability = async () => {
    const name = cleanUsername(username.trim());

    setUsername(name);
    setErrorMessage("");
    setIsAvailable(null);

    if (!name) {
      setErrorMessage(text.missingName);
      return;
    }

    if (name.length < 5) {
      setErrorMessage(text.tooShort);
      return;
    }

    if (!/[a-z]/.test(name)) {
      setErrorMessage(text.needsLetter);
      return;
    }

    if (reservedNames.includes(name)) {
      setErrorMessage(text.reserved);
      return;
    }

    setChecking(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", name)
      .maybeSingle();

    setChecking(false);

    if (error) {
      console.log(error);
      setErrorMessage(text.checkError);
      return;
    }

    setIsAvailable(!data);
  };

  return (
    <main
      dir={language === "en" ? "ltr" : "rtl"}
      className="min-h-screen bg-[#f7f8f5] px-4 py-10 text-black"
    >
      <LanguageNav language={language} setLanguage={setLanguage} />

      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="mb-3 text-center text-3xl font-bold text-black">
          {text.title}
        </h1>

        <label className="mb-3 block font-bold text-black">
          {text.usernameLabel}
        </label>

        <input
          type="text"
          value={username}
          onChange={(event) => {
            const value = cleanUsername(event.target.value);
            setUsername(value);
            setErrorMessage("");
            setIsAvailable(null);
          }}
          placeholder={text.usernamePlaceholder}
          className="mb-4 w-full rounded-xl border p-4 text-black placeholder:text-gray-400"
        />

        <p className="mb-5 text-sm leading-6 text-gray-700">{text.helper}</p>

        <button
          onClick={checkAvailability}
          disabled={checking}
          className="w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white disabled:opacity-60"
        >
          {checking ? text.checking : text.check}
        </button>

        {errorMessage && (
          <div className="mt-5 rounded-xl bg-red-100 p-4 text-center font-bold text-red-700">
            {errorMessage}
          </div>
        )}

        {isAvailable === true && (
          <>
            <div className="mt-6 rounded-xl bg-green-100 p-4 text-center font-bold text-green-700">
              {text.available}
            </div>

            <Link
              href={`/setup?name=${username.trim().toLowerCase()}`}
              className="mt-4 block rounded-xl bg-black py-4 text-center font-bold text-white"
            >
              {text.reserve}
            </Link>
          </>
        )}

        {isAvailable === false && (
          <div className="mt-6 rounded-xl bg-red-100 p-4 text-center font-bold text-red-700">
            {text.unavailable}
          </div>
        )}
      </div>
    </main>
  );
}
