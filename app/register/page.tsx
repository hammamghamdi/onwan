"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [checking, setChecking] = useState(false);

  const checkAvailability = async () => {
    const name = username.trim().toLowerCase();

    setErrorMessage("");
    setIsAvailable(null);

    if (!name) {
      setErrorMessage("أدخل اسم العنوان.");
      return;
    }

    if (name.length < 5) {
      setErrorMessage("يجب أن يكون اسم العنوان 5 خانات على الأقل.");
      return;
    }

    if (!/^[a-z0-9]+$/.test(name)) {
      setErrorMessage("يسمح فقط بالحروف الإنجليزية والأرقام بدون مسافات أو رموز.");
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
      setErrorMessage("حدث خطأ أثناء التحقق من التوفر.");
      return;
    }

    setIsAvailable(!data);
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-4 py-10 text-black">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-center text-3xl font-bold text-black">
          احجز عنوانك
        </h1>

        <p className="mb-8 text-center text-black">
          تحقق من توفر العنوان قبل حجزه
        </p>

        <label className="mb-3 block font-semibold text-black">
          اسم العنوان
        </label>

        <input
          type="text"
          value={username}
          onChange={(e) => {
            const value = e.target.value.toLowerCase();
            setUsername(value);
            setErrorMessage("");
            setIsAvailable(null);
          }}
          placeholder="مثال: hamam"
          className="mb-5 w-full rounded-xl border p-4 text-black"
        />

        <p className="mb-5 text-sm text-black">
          الحد الأدنى 5 خانات — حروف إنجليزية وأرقام فقط.
        </p>

        <button
          onClick={checkAvailability}
          disabled={checking}
          className="w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white disabled:opacity-60"
        >
          {checking ? "جاري التحقق..." : "تحقق من التوفر"}
        </button>

        {errorMessage && (
          <div className="mt-5 rounded-xl bg-red-100 p-4 text-center font-bold text-red-700 text-black">
            {errorMessage}
          </div>
        )}

        {isAvailable === true && (
          <>
            <div className="mt-6 rounded-xl bg-green-100 p-4 text-center font-bold text-green-700 text-black">
              ✅ هذا العنوان متاح
            </div>

            <Link
              href={`/setup?name=${username.trim().toLowerCase()}`}
              className="mt-4 block rounded-xl bg-black py-4 text-center font-bold text-black"
            >
              احجز هذا العنوان
            </Link>
          </>
        )}

        {isAvailable === false && (
          <div className="mt-6 rounded-xl bg-red-100 p-4 text-center font-bold text-red-700 text-black">
            ❌ هذا العنوان محجوز
          </div>
        )}
      </div>
    </main>
  );
}