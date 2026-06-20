"use client";

import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/useLanguage";
import Link from "next/link";
import { useEffect, useState } from "react";

const copy = {
  ar: {
    accountAuthed: "عناويني",
    accountGuest: "تسجيل الدخول",
    heroTitle: "كل تفاصيل الوصول في رابط واحد",
    heroText:
      "لا تشرح موقع منزلك كل مرة. أضف اللوكيشن، صور المدخل، وتعليمات الوصول في عنوان واحد وشاركه مع الجميع.",
    mainCta: "احجز عنوانك مجاناً",
    exampleCta: "مثال توضيحي",
    positioningTitle: "عنوانك ليس رابطاً مؤقتاً.",
    positioningText:
      "إنه اسم وصول دائم خاص بك، تحتفظ به مثل رقم جوالك، وتحدّث بياناته متى احتجت دون تغيير الرابط الذي تشاركه.",
    needsTitle: "متى تحتاج عنوان؟",
    needs: [
      "عندما يتصل المندوب أكثر من مرة لأنه لم يجد الموقع.",
      "عندما يصل الضيف إلى المبنى الخطأ رغم إرسال اللوكيشن.",
      "عندما يتأخر الفني لأن وصف الوصول غير واضح.",
      "عندما تضطر لإعادة شرح الموقع لكل شخص جديد.",
    ],
    finalTitle: "أنشئ عنوانك وشاركه فوراً",
    finalText:
      "اختر اسماً مختصراً، أضف بيانات الوصول، ثم شارك الرابط مع أي شخص يريد الوصول إليك.",
  },
  en: {
    accountAuthed: "My Addresses",
    accountGuest: "Log In",
    heroTitle: "Every arrival detail in one link",
    heroText:
      "Stop explaining your location again and again. Add the map link, entrance photos, and arrival instructions once, then share one address with everyone.",
    mainCta: "Reserve your address for free",
    exampleCta: "View example",
    positioningTitle: "Your address is not a temporary link.",
    positioningText:
      "It is your own permanent access name. You keep it like a phone number, update its details whenever needed, and share the same link every time.",
    needsTitle: "When do you need Onwan?",
    needs: [
      "When a delivery driver keeps calling because they cannot find the place.",
      "When a guest reaches the wrong building even after you shared the map pin.",
      "When a technician is delayed because the arrival instructions are unclear.",
      "When you have to explain the same location to every new person.",
    ],
    finalTitle: "Create your address and share it instantly",
    finalText:
      "Choose a short name, add the arrival details, then share the link with anyone who needs to reach you.",
  },
};

export default function Home() {
  const { language, setLanguage } = useLanguage();
  const text = copy[language];
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const trackHomepageVisit = async () => {
      const storageKey = "onwan_homepage_visitor_id";
      let visitorId = localStorage.getItem(storageKey);

      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(storageKey, visitorId);

        await supabase.from("homepage_visits").insert({
          visitor_id: visitorId,
        });
      }
    };

    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.log(error);
        return;
      }

      setIsAuthenticated(Boolean(user));
    };

    trackHomepageVisit();
    checkAuth();
  }, []);

  return (
    <main
      dir={language === "en" ? "ltr" : "rtl"}
      className="min-h-screen bg-[#f7f8f5] px-5 text-[#1f2d2b]"
    >
      <div className="mx-auto max-w-4xl">
        <nav
          dir="ltr"
          className="flex items-center justify-between py-6 text-sm"
        >
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

          <Link
            href={isAuthenticated ? "/addresses" : "/login"}
            className="rounded-full border border-[#006b4f] px-5 py-2 text-sm font-semibold text-[#006b4f]"
          >
            {isAuthenticated ? text.accountAuthed : text.accountGuest}
          </Link>
        </nav>

        <section className="pb-6 pt-10 text-center sm:pt-12">
          <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl">
            {text.heroTitle}
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-gray-700">
            {text.heroText}
          </p>

          <div className="mx-auto flex max-w-sm flex-col gap-3">
            <Link
              href="/register"
              className="rounded-full bg-[#006b4f] px-8 py-4 font-bold text-white"
            >
              {text.mainCta}
            </Link>

            <Link
              href="/abdullah"
              className="rounded-full border border-[#006b4f] bg-[#eef5f1] px-8 py-4 font-bold text-[#006b4f]"
            >
              {text.exampleCta}
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-2xl pb-16 pt-2 text-center sm:pb-20">
          <h2 className="mb-3 text-2xl font-bold">{text.positioningTitle}</h2>
          <p className="text-lg leading-8 text-gray-700">
            {text.positioningText}
          </p>
        </section>

        <section className="mt-4 rounded-3xl bg-[#eef5f1] p-7 text-center sm:mt-8">
          <h2 className="mb-4 text-2xl font-bold">{text.needsTitle}</h2>

          <div
            className={`grid gap-3 sm:grid-cols-2 ${
              language === "en" ? "text-left" : "text-right"
            }`}
          >
            {text.needs.map((need) => (
              <div key={need} className="rounded-2xl bg-white p-4 shadow-sm">
                {need}
              </div>
            ))}
          </div>
        </section>

        <section className="py-12 text-center">
          <h2 className="mb-4 text-2xl font-bold">{text.finalTitle}</h2>

          <p className="mx-auto mb-6 max-w-2xl leading-8 text-gray-700">
            {text.finalText}
          </p>

          <Link
            href="/register"
            className="inline-block rounded-full bg-[#006b4f] px-8 py-4 font-bold text-white"
          >
            {text.mainCta}
          </Link>
        </section>
      </div>
    </main>
  );
}
