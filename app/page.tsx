import Link from "next/link";

export default function Home() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-6 text-[#1f2d2b]">
      <div className="mx-auto max-w-5xl">
        {/* Navbar */}
        <nav className="flex items-center justify-between py-6">
          <div className="text-2xl font-bold text-[#006b4f]">عنوان</div>

          <Link
            href="/register"
            className="rounded-full border border-[#006b4f] px-5 py-2 text-sm font-semibold text-[#006b4f]"
          >
            احجز عنوانك
          </Link>
        </nav>

        {/* Hero */}
        <section className="py-16 text-center">
          <p className="mb-6 text-sm font-bold text-[#006b4f]">
            عنوان واحد لكل طرق الوصول إليك
          </p>

          <h1 className="mb-6 text-5xl font-bold leading-tight">
            عنوان واحد.. لكل من يبحث عنك
          </h1>

          <p className="mx-auto mb-10 max-w-3xl text-xl leading-9 text-gray-700">
            لا تشرح موقعك أكثر من مرة. اجمع الموقع، صور الوصول، وتعليمات
            الوصول في عنوان واحد وشاركه مع أي شخص يريد الوصول إليك.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-full bg-[#006b4f] px-8 py-4 font-bold text-white"
            >
              احجز عنوانك مجانًا
            </Link>

            <button className="rounded-full border border-gray-300 px-8 py-4 font-bold">
              شاهد مثالًا
            </button>
          </div>
        </section>

        {/* Pain Points */}
        <section className="py-10">
          <h2 className="mb-8 text-center text-3xl font-bold">
            متى تحتاج عنوان؟
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              عندما يتصل المندوب أكثر من مرة لأنه لم يجد الموقع.
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              عندما يصل الضيف إلى المبنى الخطأ رغم إرسال اللوكيشن.
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              عندما يتأخر الفني لأن وصف الوصول غير واضح.
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              عندما تضطر لإعادة شرح الموقع لكل شخص جديد.
            </div>
          </div>
        </section>

        {/* Problem + Solution */}
        <section className="mt-10 rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="mb-8 text-3xl font-bold">
            بدل إرسال كل هذه التفاصيل كل مرة:
          </h2>

          <div className="rounded-2xl bg-gray-50 p-6 leading-10 text-gray-700">
            <p>📍 هذا اللوكيشن</p>
            <p>🏢 العمارة الثالثة</p>
            <p>⬆️ الدور الثاني</p>
            <p>🚪 الشقة يمين</p>
            <p>📷 الباب لونه بني</p>
          </div>

          <div className="my-10 text-center text-4xl">↓</div>

          <h2 className="mb-6 text-center text-4xl font-bold">
            أرسل عنوانك فقط
          </h2>

          <div
            dir="ltr"
            className="mx-auto w-fit rounded-full bg-[#006b4f] px-8 py-4 text-xl font-bold text-white"
          >
            onwan.sa/abdullah
          </div>
        </section>

        {/* Address Demo */}
        <section className="py-16 text-center">
          <h2 className="mb-8 text-3xl font-bold">
            كيف تظهر صفحة عنوانك؟
          </h2>

          <div className="mx-auto max-w-sm rounded-[36px] border-8 border-gray-800 bg-white p-6 shadow-xl">
            <h3 className="mb-5 text-lg font-bold">صفحة عنوانك</h3>

            <div className="mb-4 rounded-2xl bg-gray-100 p-5">
              <div className="mb-2 text-sm font-bold text-[#006b4f]">الخريطة</div>
              <div className="flex h-24 items-center justify-center rounded-xl bg-gray-200 text-gray-500">
                خريطة الموقع
              </div>
            </div>

            <div className="mb-4 rounded-2xl bg-gray-100 p-5">
              <div className="mb-2 text-sm font-bold text-[#006b4f]">
                صور الوصول
              </div>
              <div className="flex h-20 items-center justify-center rounded-xl bg-gray-200 text-gray-500">
                صورة توضيحية
              </div>
            </div>

            <div className="rounded-2xl bg-gray-100 p-5 text-right">
              <div className="mb-2 text-sm font-bold text-[#006b4f]">
                تعليمات الوصول
              </div>
              <p className="text-sm leading-7 text-gray-700">
                ادخل من البوابة الرئيسية، ثم اتجه يمينًا. المصعد في نهاية الممر.
              </p>
            </div>
          </div>
        </section>

        {/* Digital Asset */}
        <section className="rounded-3xl bg-[#eef5f1] p-10 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            ليس مجرد رابط
          </h2>

          <p className="mx-auto max-w-3xl text-xl leading-9 text-gray-700">
            عنوان ليس رسالة مؤقتة في واتساب. إنه عنوان رقمي ثابت يمكنك الاحتفاظ
            به واستخدامه كلما أردت مشاركة طريقة الوصول إليك.
          </p>
        </section>

        {/* Benefits */}
        <section className="py-16">
          <h2 className="mb-8 text-center text-3xl font-bold">
            لماذا عنوان؟
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              تقليل اتصالات المندوبين والزوار
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              وصول أسرع وأوضح للموقع
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              جمع الموقع والصور والتعليمات في صفحة واحدة
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              مشاركة أسهل عبر واتساب
            </div>
          </div>
        </section>

        {/* Permanent Address */}
        <section className="mb-16 rounded-3xl bg-[#006b4f] p-10 text-center text-white">
          <h2 className="mb-4 text-3xl font-bold">
            عنوان ثابت يتغير من الداخل
          </h2>

          <p className="mx-auto mb-6 max-w-2xl text-lg leading-8">
            تغيّرت تفاصيل الوصول؟ حدّث بيانات العنوان فقط، وشارك نفس الرابط
            دون الحاجة لإرسال شرح جديد كل مرة.
          </p>

          <div
            dir="ltr"
            className="inline-block rounded-full bg-white px-6 py-3 font-bold text-[#006b4f]"
          >
            onwan.sa/abdullah
          </div>
        </section>
      </div>
    </main>
  );
}