import Link from "next/link";

export default function Home() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-5 text-[#1f2d2b]">
      <div className="mx-auto max-w-4xl">
        <nav className="flex items-center justify-between py-6">
          <div className="text-2xl font-bold text-[#006b4f]">عنوان</div>

          <Link
            href="/register"
            className="rounded-full border border-[#006b4f] px-5 py-2 text-sm font-semibold text-[#006b4f]"
          >
            احجز عنوانك
          </Link>
        </nav>

        <section className="py-12 text-center">
          <p className="mb-5 text-sm font-bold text-[#006b4f]">
            رابط واحد لكل تفاصيل الوصول
          </p>

          <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl">
            عنوان واحد.. لكل من يبحث عنك
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-gray-700">
            لا تشرح موقعك مرتين. اجمع الموقع، صور المدخل، وتعليمات الوصول في
            عنوان واحد وشاركه مع الجميع.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="rounded-full bg-[#006b4f] px-8 py-4 font-bold text-white"
            >
              احجز عنوانك مجانًا
            </Link>

            <Link
              href="/abdullah"
              className="rounded-full border border-[#006b4f] bg-[#eef5f1] px-8 py-4 font-bold text-[#006b4f]"
            >
              مثال توضيحي
            </Link>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-center text-2xl font-bold">
            ماذا يجمع عنوانك؟
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-5 text-center">
              <div className="mb-2 text-2xl">📍</div>
              <div className="font-bold">رابط الخريطة</div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-5 text-center">
              <div className="mb-2 text-2xl">📷</div>
              <div className="font-bold">صور المدخل</div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-5 text-center">
              <div className="mb-2 text-2xl">📝</div>
              <div className="font-bold">تعليمات الوصول</div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <h2 className="mb-6 text-center text-2xl font-bold">
            بدل إرسال كل التفاصيل كل مرة
          </h2>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="rounded-2xl bg-gray-50 p-5 leading-9 text-gray-700">
              <p>📍 هذا اللوكيشن</p>
              <p>🏢 العمارة الثالثة</p>
              <p>⬆️ الدور الثاني</p>
              <p>🚪 الشقة يمين</p>
              <p>📷 الباب لونه بني</p>
            </div>

            <div className="my-7 text-center text-3xl">↓</div>

            <div
              dir="ltr"
              className="mx-auto w-fit rounded-full bg-[#006b4f] px-6 py-3 text-lg font-bold text-white"
            >
              onwan.sa/abdullah
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-[#eef5f1] p-7 text-center">
          <h2 className="mb-4 text-2xl font-bold">متى تحتاج عنوان؟</h2>

          <div className="grid gap-3 text-right sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              عندما يتصل المندوب أكثر من مرة لأنه لم يجد الموقع.
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              عندما يصل الضيف إلى المبنى الخطأ رغم إرسال اللوكيشن.
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              عندما يتأخر الفني لأن وصف الوصول غير واضح.
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              عندما تضطر لإعادة شرح الموقع لكل شخص جديد.
            </div>
          </div>
        </section>

        <section className="py-12 text-center">
          <h2 className="mb-4 text-2xl font-bold">
            أنشئ عنوانك وشاركه فورًا
          </h2>

          <p className="mx-auto mb-6 max-w-2xl leading-8 text-gray-700">
            اختر اسمًا مختصرًا، أضف بيانات الوصول، ثم شارك الرابط مع أي شخص
            يريد الوصول إليك.
          </p>

          <Link
            href="/register"
            className="inline-block rounded-full bg-[#006b4f] px-8 py-4 font-bold text-white"
          >
            احجز عنوانك مجانًا
          </Link>
        </section>
      </div>
    </main>
  );
}