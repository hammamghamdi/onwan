"use client";

import type { Language } from "@/lib/useLanguage";
import Link from "next/link";

type LanguageNavProps = {
  language: Language;
  setLanguage: (language: Language) => void;
};

export function LanguageNav({ language, setLanguage }: LanguageNavProps) {
  return (
    <div className="mx-auto mb-4 flex w-full max-w-sm items-center justify-between text-sm sm:max-w-4xl">
      <Link href="/" className="font-bold text-[#006b4f]">
        {language === "en" ? "Home" : "الصفحة الرئيسية"}
      </Link>

      <div className="flex items-center gap-2 font-bold text-gray-600">
        <button
          type="button"
          onClick={() => setLanguage("ar")}
          className={language === "ar" ? "text-[#006b4f]" : ""}
        >
          العربية
        </button>
        <span>|</span>
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={language === "en" ? "text-[#006b4f]" : ""}
        >
          English
        </button>
      </div>
    </div>
  );
}
