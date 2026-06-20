"use client";

import { LanguageNav } from "@/app/components/LanguageNav";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/useLanguage";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const copy = {
  ar: {
    noEmail: "أدخل بريدك الإلكتروني.",
    invalidEmail: "أدخل بريدًا إلكترونيًا صحيحًا.",
    noUserEmail: "المستخدم المسجل لا يحتوي على بريد إلكتروني.",
    claimError:
      "تم تسجيل الدخول، لكن تعذر ربط عناوينك بالبريد الإلكتروني.",
    authErrorPrefix: "تعذر إرسال رابط الدخول. رسالة Supabase:",
    sent: "تم إرسال رابط الدخول. تحقق من بريدك الإلكتروني.",
    title: "تسجيل الدخول",
    intro:
      "أدخل بريدك الإلكتروني وسنرسل لك رابط دخول آمن بدون كلمة مرور.",
    emailLabel: "البريد الإلكتروني",
    loading: "جاري الإرسال...",
    send: "إرسال رابط الدخول",
    checkingSession: "جاري التحقق من تسجيل الدخول...",
  },
  en: {
    noEmail: "Enter your email address.",
    invalidEmail: "Enter a valid email address.",
    noUserEmail: "Authenticated user has no email.",
    claimError:
      "You are signed in, but we could not link your addresses to this email.",
    authErrorPrefix: "Could not send the login link. Supabase message:",
    sent: "Login link sent. Check your email.",
    title: "Log In",
    intro:
      "Enter your email and we will send a secure login link without a password.",
    emailLabel: "Email",
    loading: "Sending...",
    send: "Send Login Link",
    checkingSession: "Checking your login...",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const text = copy[language];
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const connectOwnedAddresses = useCallback(
    async (userId: string, userEmail?: string) => {
      if (!userEmail) {
        console.log(text.noUserEmail);
        return;
      }

      const { error } = await supabase
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
      }
    },
    [text.claimError, text.noUserEmail]
  );

  useEffect(() => {
    let isMounted = true;

    const redirectAuthenticatedUser = async (
      userId: string,
      userEmail?: string
    ) => {
      await connectOwnedAddresses(userId, userEmail);

      if (!isMounted) return;

      router.replace("/addresses");
    };

    const checkCurrentUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (error) {
        console.log(error);
        setAuthChecking(false);
        return;
      }

      if (user) {
        await redirectAuthenticatedUser(user.id, user.email);
        return;
      }

      setAuthChecking(false);
    };

    checkCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setAuthChecking(true);
        redirectAuthenticatedUser(session.user.id, session.user.email);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [connectOwnedAddresses, router]);

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

      {authChecking ? (
        <div className="mx-auto max-w-sm rounded-3xl bg-white p-6 text-center font-bold text-black shadow-sm">
          {text.checkingSession}
        </div>
      ) : (
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
            className="w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white disabled:opacity-60"
          >
            {loading ? text.loading : text.send}
          </button>
        </div>
      )}
    </main>
  );
}
