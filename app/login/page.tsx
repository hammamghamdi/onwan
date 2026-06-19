"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const connectOwnedAddresses = async (
    userId: string,
    userEmail?: string
  ) => {
    if (!userEmail) {
      console.log("Authenticated user has no email.");
      return;
    }

    const { count, error } = await supabase
      .from("profiles")
      .update(
        { user_id: userId },
        {
          count: "exact",
        }
      )
      .eq("email", userEmail.trim().toLowerCase())
      .is("user_id", null);

    if (error) {
      console.log(error);
      setIsSuccess(false);
      setMessage("تم تسجيل الدخول، لكن تعذر ربط عناوينك بالبريد الإلكتروني.");
      return;
    }

    if (count && count > 0) {
      setIsSuccess(true);
      setMessage("تم تسجيل الدخول وربط عناوينك بهذا البريد الإلكتروني.");
    }
  };

  useEffect(() => {
    const connectCurrentUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.log(error);
        return;
      }

      if (user) {
        await connectOwnedAddresses(user.id, user.email);
      }
    };

    connectCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        connectOwnedAddresses(session.user.id, session.user.email);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const sendMagicLink = async () => {
    const cleanEmail = email.trim().toLowerCase();

    setMessage("");
    setIsSuccess(false);

    if (!cleanEmail) {
      setMessage("أدخل بريدك الإلكتروني.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setMessage("أدخل بريدًا إلكترونيًا صحيحًا.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/login`
            : undefined,
      },
    });

    setLoading(false);

    if (error) {
      console.log(error);
      setMessage("تعذر إرسال رابط الدخول. حاول مرة أخرى.");
      return;
    }

    setIsSuccess(true);
    setMessage("تم إرسال رابط الدخول. تحقق من بريدك الإلكتروني.");
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-4 py-10 text-black">
      <div className="mx-auto max-w-sm rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="mb-3 text-center text-3xl font-bold text-black">
          تسجيل الدخول
        </h1>

        <p className="mb-6 text-center leading-7 text-gray-700">
          أدخل بريدك الإلكتروني وسنرسل لك رابط دخول آمن بدون كلمة مرور.
        </p>

        <label className="mb-2 block font-bold text-black">
          البريد الإلكتروني
        </label>
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setMessage("");
            setIsSuccess(false);
          }}
          className="mb-4 w-full rounded-xl border p-4 text-black"
          placeholder="example@email.com"
        />

        {message && (
          <p
            className={`mb-4 rounded-xl p-3 text-center font-bold ${
              isSuccess
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </p>
        )}

        <button
          onClick={sendMagicLink}
          disabled={loading}
          className="w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white disabled:opacity-60"
        >
          {loading ? "جاري الإرسال..." : "إرسال رابط الدخول"}
        </button>
      </div>
    </main>
  );
}
