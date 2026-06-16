"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [checking, setChecking] = useState(false);

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

  const cleanUsername = (value: string) => {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  const checkAvailability = async () => {
    const name = cleanUsername(username.trim());

    setUsername(name);
    setErrorMessage("");
    setIsAvailable(null);

    if (!name) {
      setErrorMessage("اكتب اسم العنوان أولًا.");
      return;
    }

    if (name.length < 5) {
      setErrorMessage("اسم العنوان يجب أن يكون 5 خانات على الأقل.");
      return;
    }

    if (!/[a-z]/.test(name)) {
      setErrorMessage("اسم العنوان يجب أن يحتوي على حرف إنجليزي واحد على الأقل.");
      return;
    }

    if (reservedNames.includes(name)) {
      setErrorMessage("هذا الاسم غير متاح للاستخدام.");
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
      setErrorMessage("حدث خطأ أثناء التحقق. حاول مرة أخرى.");
      return;
    }

    setIsAvailable(!data);
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-4 py-10 text-black">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="mb-3 text-center text-3xl font-bold text-black">
          اختر اسم عنوانك
        </h1>

        <label className="mb-3 block font-bold text-black">
          اسم العنوان
        </label>

        <input
          type="text"
          value={username}
          onChange={(e) => {
            const value = cleanUsername(e.target.value);
            setUsername(value);
            setErrorMessage("");
            setIsAvailable(null);
          }}
          placeholder="مثال: abdullah"
          className="mb-4 w-full rounded-xl border p-4 text-black placeholder:text-gray-400"
        />

        <p className="mb-5 text-sm leading-6 text-gray-700">
          اختر اسمًا سهلًا تقدر تشاركه مع الآخرين. الحروف الإنجليزية والأرقام فقط، والحد الأدنى 5 خانات.
        </p>

        <button
          onClick={checkAvailability}
          disabled={checking}
          className="w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white disabled:opacity-60"
        >
          {checking ? "جاري التحقق..." : "تحقق من التوفر"}
        </button>

        {errorMessage && (
          <div className="mt-5 rounded-xl bg-red-100 p-4 text-center font-bold text-red-700">
            {errorMessage}
          </div>
        )}

        {isAvailable === true && (
          <>
            <div className="mt-6 rounded-xl bg-green-100 p-4 text-center font-bold text-green-700">
              ✅ هذا العنوان متاح
            </div>

            <Link
              href={`/setup?name=${username.trim().toLowerCase()}`}
              className="mt-4 block rounded-xl bg-black py-4 text-center font-bold text-white"
            >
              احجز هذا العنوان
            </Link>
          </>
        )}

        {isAvailable === false && (
          <div className="mt-6 rounded-xl bg-red-100 p-4 text-center font-bold text-red-700">
            ❌ هذا العنوان محجوز
          </div>
        )}
      </div>
    </main>
  );
}