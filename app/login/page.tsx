"use client";

import { LanguageNav } from "@/app/components/LanguageNav";
import { createAppUrl } from "@/lib/appUrl";
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
    rateLimit:
      "تم طلب روابط دخول كثيرة خلال وقت قصير. انتظر من 30 إلى 60 دقيقة ثم حاول مرة أخرى.",
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
    rateLimit:
      "Too many login links were requested in a short time. Please wait 30 to 60 minutes and try again.",
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

type MessageKey = "rateLimit";
type SupabaseSession = NonNullable<
  Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]
>;

const isSupabaseEmailRateLimit = (value: string) => {
  return value.toLowerCase().includes("email rate limit exceeded");
};

export default function LoginPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const text = copy[language];
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [messageKey, setMessageKey] = useState<MessageKey | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const displayedMessage = messageKey ? text[messageKey] : message;

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const clearMessage = () => {
    setMessage("");
    setMessageKey(null);
  };

  const getMagicLinkRedirectUrl = useCallback(() => {
    return createAppUrl("/addresses");
  }, []);

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
        setMessageKey(null);
        setMessage(text.claimError);
      }
    },
    [text.claimError, text.noUserEmail]
  );

  useEffect(() => {
    let isMounted = true;

    const redirectAuthenticatedUser = async (session: SupabaseSession) => {
      await connectOwnedAddresses(session.user.id, session.user.email);

      if (!isMounted) return;

      router.replace("/addresses");
    };

    const handleSession = async (
      session: Awaited<
        ReturnType<typeof supabase.auth.getSession>
      >["data"]["session"]
    ) => {
      if (!session?.user) return false;

      await redirectAuthenticatedUser(session);
      return true;
    };

    const checkCurrentSession = async () => {
      const callbackCode =
        typeof window !== "undefined"
          ? new URL(window.location.href).searchParams.get("code")
          : null;

      if (callbackCode) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          callbackCode
        );

        if (!isMounted) return;

        if (data.session && (await handleSession(data.session))) {
          return;
        }

        if (error) {
          console.log(error);
        }
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.log(error);
        setAuthChecking(false);
        return;
      }

      if (await handleSession(session)) {
        return;
      }

      setAuthChecking(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === "INITIAL_SESSION" || event === "SIGNED_IN") &&
        session?.user
      ) {
        setAuthChecking(true);
        redirectAuthenticatedUser(session);
      }
    });

    checkCurrentSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [connectOwnedAddresses, router]);

  const sendMagicLink = async () => {
    const cleanEmail = email.trim().toLowerCase();

    clearMessage();
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
        emailRedirectTo: getMagicLinkRedirectUrl(),
      },
    });
    const errorMessage = error?.message || "";

    setLoading(false);

    if (errorMessage) {
      console.log(errorMessage);
      if (isSupabaseEmailRateLimit(errorMessage)) {
        setMessageKey("rateLimit");
        return;
      }

      setMessage(`${text.authErrorPrefix} ${errorMessage}`);
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
              clearMessage();
              setIsSuccess(false);
            }}
            className="mb-4 w-full rounded-xl border p-4 text-black"
            placeholder="example@email.com"
          />

          {displayedMessage && (
            <p
              className={`mb-4 rounded-xl p-3 text-center font-bold ${
                isSuccess
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {displayedMessage}
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
