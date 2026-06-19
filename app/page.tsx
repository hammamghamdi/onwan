"use client";

import Link from "next/link";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
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

    trackHomepageVisit();
  }, []);

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-5 text-[#1f2d2b]">
      <div className="mx-auto max-w-5xl">
        <nav className="flex items-center justify-between py-5">
          <div className="text-2xl font-bold text-[#006b4f]">عنوان</div>

          <Link
            href="/register"
            className="rounded-full border border-[#006b4f] px-5 py-2 text-sm font-semibold text-[#006b4f]"
          >
            احجز عنوانك
          </Link>
        </nav>

        <section className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="text-center lg:text-right">
            <p className="mb-4 inline-flex rounded-full bg-[#eef5f1] px-4 py-2 text-sm font-bold text-[#006b4f]">
              عنوانك الشخصي الدائم في رابط واحد
            </p>

            <h1 className="mb-5 text-4xl font-bold leading-tight sm:text-5xl">
              خل الناس توصل لك بدون شرح ومكالمات
            </h1>

            <p className="mx-auto mb-7 max-w-2xl text-lg leading-9 text-gray-700 lg:mx-0">
              مع عنوان تختار اسم قصير مثل onwan.sa/abdullah، وتحط فيه الموقع،
              صور المدخل، وتعليمات الوصول. أرسله مرة واحدة وخله عنوانك الشخصي
              الثابت للطلبات والضيوف والفنيين.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/register"
                className="rounded-full bg-[#006b4f] px-8 py-4 text-center font-bold text-white shadow-sm"
              >
                احجز عنوانك المجاني
              </Link>

              <Link
                href="/abdullah"
                className="rounded-full border border-[#006b4f] bg-white px-8 py-4 text-center font-bold text-[#006b4f]"
              >
                شوف مثال جاهز
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-[#dfe8e3] bg-white p-5 shadow-sm">
            <div className="mb-4 rounded-2xl bg-[#f7f8f5] p-4">
              <p className="mb-3 text-sm font-bold text-gray-500">
                بدل الرسالة الطويلة كل مرة
              </p>
              <div className="space-y-2 leading-8 text-gray-700">
                <p>أرسل اللوكيشن</p>
                <p>ادخل من البوابة الثانية</p>
                <p>لف يمين بعد المصعد</p>
                <p>الدور الثاني، الشقة آخر الممر</p>
                <p>الباب بني وعليه لوحة صغيرة</p>
              </div>
            </div>

            <div className="mb-4 flex justify-center text-2xl text-[#006b4f]">
              ↓
            </div>

            <div
              dir="ltr"
              className="rounded-2xl bg-[#006b4f] px-5 py-4 text-center text-xl font-bold text-white"
            >
              onwan.sa/abdullah
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="mb-6 text-center">
            <h2 className="mb-3 text-2xl font-bold">
              المشكلة مو في اللوكيشن، المشكلة في التفاصيل
            </h2>
            <p className="mx-auto max-w-2xl leading-8 text-gray-700">
              في السعودية كثير من الأماكن تحتاج وصف زيادة: مدخل، دور، شقة،
              موقف، أو علامة واضحة. عنوان يجمعها كلها في رابط مرتب وسهل.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="mb-2 text-lg font-bold">اتصالات متكررة</p>
              <p className="leading-7 text-gray-700">
                المندوب يتصل أكثر من مرة لأنه وصل قريب بس ما عرف المدخل.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="mb-2 text-lg font-bold">توصيل يلخبط</p>
              <p className="leading-7 text-gray-700">
                الضيف أو الطلب يوصل للعمارة الصح، لكن يوقف عند الباب الغلط.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="mb-2 text-lg font-bold">شرح يتكرر</p>
              <p className="leading-7 text-gray-700">
                كل شخص جديد يحتاج نفس الكلام: وين يدخل، وين يوقف، وكيف يوصلك.
              </p>
            </div>
          </div>
        </section>

        <section className="my-8 rounded-3xl bg-[#eef5f1] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <h2 className="mb-3 text-2xl font-bold">
                عنوان واحد تستخدمه كل مرة
              </h2>
              <p className="leading-8 text-gray-700">
                احجز اسمك المميز قبل غيرك، وخله رابطك الدائم للوصول. كل ما
                تغيرت التفاصيل تقدر تحدّث العنوان بدل ما تعيد شرح المكان من
                جديد.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="font-bold">اسم سهل للحفظ</p>
                <p dir="ltr" className="mt-2 text-sm text-gray-600">
                  onwan.sa/yourname
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="font-bold">موقع وصور وتعليمات</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  كل تفاصيل الوصول في صفحة واحدة.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="font-bold">مناسب للبيت والعمل</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  للطلبات، الضيوف، الصيانة، والمشاوير.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="font-bold">رابط ثابت تشاركه</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  أرسله لأي شخص يحتاج يوصل لك.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            احجز عنوانك قبل ما يأخذه أحد غيرك
          </h2>

          <p className="mx-auto mb-6 max-w-2xl leading-8 text-gray-700">
            اختر اسم مختصر، أضف تفاصيل الوصول، وابدأ تستخدم رابطك الشخصي
            الدائم في كل مرة تحتاج أحد يوصلك.
          </p>

          <Link
            href="/register"
            className="inline-block rounded-full bg-[#006b4f] px-8 py-4 font-bold text-white shadow-sm"
          >
            احجز عنوانك المجاني الآن
          </Link>
        </section>
      </div>
    </main>
  );
}
