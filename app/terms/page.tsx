import Link from "next/link";

export default function TermsPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-5 py-8 text-black">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 leading-8 shadow-sm">
        <h1 className="mb-4 text-3xl font-black">شروط الاستخدام</h1>
        <p>
          باستخدام Onwan فإنك توافق على استخدام الخدمة لإنشاء ومشاركة عناوين
          وصول صحيحة وواضحة فقط.
        </p>
        <p>
          يمنع استخدام Onwan لأي نشاط غير قانوني، أو انتحال شخصية، أو إنشاء
          عناوين مضللة، أو نشر محتوى ضار، أو إساءة استخدام روابط العناوين.
        </p>
        <p>
          يحق لـ Onwan تعليق أي عنوان يخالف هذه الشروط أو يسبب ضررًا أو تضليلًا
          للمستخدمين دون حذف بيانات صاحب العنوان.
        </p>
        <Link href="/" className="mt-6 inline-block font-bold text-[#006b4f]">
          العودة للرئيسية
        </Link>
      </article>
    </main>
  );
}
