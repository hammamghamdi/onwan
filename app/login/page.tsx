"use client";

import { LanguageNav } from "@/app/components/LanguageNav";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/useLanguage";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const copy = {
  ar: {
    noEmail: "أدخل بريدك الإلكتروني.",
    invalidEmail: "أدخل بريدًا إلكترونيًا صحيحًا.",
    noUserEmail: "المستخدم المسجل لا يحتوي على بريد إلكتروني.",
    claimError:
      "تم تسجيل الدخول، لكن تعذر ربط عناوينك بالبريد الإلكتروني.",
    claimed:
      "تم تسجيل الدخول وربط عناوينك بهذا البريد الإلكتروني.",
    authErrorPrefix: "تعذر إرسال رابط الدخول. رسالة Supabase:",
    sent: "تم إرسال رابط الدخول. تحقق من بريدك الإلكتروني.",
    title: "تسجيل الدخول",
    intro:
      "أدخل بريدك الإلكتروني وسنرسل لك رابط دخول آمن بدون كلمة مرور.",
    emailLabel: "البريد الإلكتروني",
    loading: "جاري الإرسال...",
    send: "إرسال رابط الدخول",
    addresses: "عرض عناويني",
  },
  en: {
    noEmail: "Enter your email address.",
    invalidEmail: "Enter a valid email address.",
    noUserEmail: "Authenticated user has no email.",
    claimError:
      "You are signed in, but we could not link your addresses to this email.",
    claimed: "You are signed in and your addresses are linked to this email.",
    authErrorPrefix: "Could not send the login link. Supabase message:",
    sent: "Login link sent. Check your email.",
    title: "Log In",
    intro:
      "Enter your email and we will send a secure login link without a password.",
    emailLabel: "Email",
    loading: "Sending...",
    send: "Send Login Link",
    addresses: "View My Addresses",
  },
};

export default function LoginPage() {
  const { language, setLanguage } = useLanguage();
  const text = copy[language];
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const connectOwnedAddresses = useCallback(
    async (userId: string, userEmail?: string) => {
      if (!userEmail) {
        console.log(text.noUserEmail);
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
        setMessage(text.claimError);
        return;
      }

      if (count && count > 0) {
        setIsSuccess(true);
        setMessage(text.claimed);
      }
    },
    [text.claimError, text.claimed, text.noUserEmail]
  );

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
        setIsSignedIn(true);
        await connectOwnedAddresses(user.id, user.email);
      }
    };

    connectCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setIsSignedIn(true);
        connectOwnedAddresses(session.user.id, session.user.email);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [connectOwnedAddresses]);

  const sendMagicLink = async () => {
    const cleanEmail = email.trim().toLowerCase();

    setMessage("");
    setIsSuccess(false);

    if (!cleanEmail) {
      setMessage(text.noEmail);
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setMessage(text.invalidEmail);
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
      setMessage(`${text.authErrorPrefix} ${error.message}`);
      return;
    }

    setIsSuccess(true);
    setMessage(text.sent);
  };

  return (
    <main
      dir={language === "en" ? "ltr" : "rtl"}
      className="min-h-screen bg-[#f7f8f5] px-4 py-6 text-black"
    >
      <LanguageNav language={language} setLanguage={setLanguage} />

      <div className="mx-auto max-w-sm rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="mb-3 text-center text-3xl font-bold text-black">
          {text.title}
        </h1>

        <p className="mb-6 text-center leading-7 text-gray-700">
          {text.intro}
        </p>

        <label className="mb-2 block font-bold text-black">
          {text.emailLabel}
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
          className="mb-4 w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white disabled:opacity-60"
        >
          {loading ? text.loading : text.send}
        </button>

        {isSignedIn && (
          <Link
            href="/addresses"
            className="block w-full rounded-xl border border-black py-4 text-center font-bold text-black"
          >
            {text.addresses}
          </Link>
        )}
      </div>
    </main>
  );
}
