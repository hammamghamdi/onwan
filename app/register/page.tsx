"use client";

import { LanguageNav } from "@/app/components/LanguageNav";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/useLanguage";
import {
  hasOnlyUsernameCharacters,
  getDisplayUsername,
  isValidUsername,
  normalizeUsername,
  startsWithEnglishLetter,
} from "@/lib/username";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    missingName: "اكتب اسم العنوان أولاً.",
    tooShort: "اسم العنوان يجب أن يكون 5 خانات على الأقل.",
    needsLetter:
      "اسم العنوان يجب أن يحتوي على حرف إنجليزي واحد على الأقل.",
    reserved: "هذا الاسم غير متاح للاستخدام.",
    checkError: "حدث خطأ أثناء التحقق. حاول مرة أخرى.",
    title: "اختر اسم عنوانك",
    usernameLabel: "اسم العنوان",
    usernamePlaceholder: "مثال: abdullah",
    helper:
      "اختر اسماً سهلاً تقدر تشاركه مع الآخرين. الحروف الإنجليزية والأرقام فقط، والحد الأدنى 5 خانات.",
    checking: "جاري التحقق...",
    check: "احجز عنوانك الآن",
    unavailable: "هذا العنوان محجوز",
  },
  en: {
    missingName: "Enter an address name first.",
    tooShort: "",
    needsLetter: "Address name must include at least one English letter.",
    reserved: "This name is not available for use.",
    checkError: "An error occurred while checking. Try again.",
    title: "Choose your address name",
    usernameLabel: "Address name",
    usernamePlaceholder: "Example: Abdullah",
    helper:
      "Choose an easy name you can share with others. English letters and numbers only.",
    checking: "Checking...",
    check: "Reserve your address now",
    unavailable: "This address is already taken",
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const text = copy[language];
  const [username, setUsername] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [checking, setChecking] = useState(false);

  const checkAvailability = async () => {
    const typedName = username.trim();
    const displayName = getDisplayUsername(typedName);
    const name = normalizeUsername(typedName);

    setUsername(name);
    setErrorMessage("");
    setIsAvailable(null);

    if (!name) {
      setErrorMessage(text.missingName);
      return;
    }

    if (
      !startsWithEnglishLetter(typedName) ||
      !hasOnlyUsernameCharacters(typedName)
    ) {
      setErrorMessage(text.needsLetter);
      return;
    }

    if (!isValidUsername(name)) {
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
      .ilike("username", name)
      .limit(1);

    setChecking(false);

    if (error) {
      console.log(error);
      setErrorMessage(text.checkError);
      return;
    }

    if (data && data.length > 0) {
      setIsAvailable(false);
      return;
    }

    const setupParams = new URLSearchParams({
      name,
      displayName,
    });

    router.push(`/setup?${setupParams.toString()}`);
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
            setUsername(event.target.value.trim());
            setErrorMessage("");
            setIsAvailable(null);
          }}
          placeholder={text.usernamePlaceholder}
          className="mb-4 w-full rounded-xl border p-4 text-black placeholder:text-gray-400"
        />

        <p className="mb-5 text-sm leading-6 text-gray-700">{text.helper}</p>

        <p className="mb-5 text-sm leading-7 text-gray-700">
          بإنشاء العنوان فإنك توافق على{" "}
          <Link href="/terms" className="font-bold text-[#006b4f]">
            الشروط والأحكام
          </Link>{" "}
          و{" "}
          <Link href="/privacy" className="font-bold text-[#006b4f]">
            سياسة الخصوصية
          </Link>{" "}
          و{" "}
          <Link href="/acceptable-use" className="font-bold text-[#006b4f]">
            سياسة الاستخدام المقبول
          </Link>
          .
        </p>

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

        {isAvailable === false && (
          <div className="mt-6 rounded-xl bg-red-100 p-4 text-center font-bold text-red-700">
            {text.unavailable}
          </div>
        )}
      </div>
    </main>
  );
}
