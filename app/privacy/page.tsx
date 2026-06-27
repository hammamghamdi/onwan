import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-5 py-8 text-black">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 leading-8 shadow-sm">
        <h1 className="mb-4 text-3xl font-black">سياسة الخصوصية</h1>
        <p>
          يجمع Onwan المعلومات التي يضيفها صاحب العنوان مثل اسم العنوان، المدينة،
          رابط الخريطة، صور الوصول، وتعليمات الوصول بهدف عرض العنوان العام.
        </p>
        <p>
          لا يتم عرض رموز التعديل أو صفحات الإدارة للعامة. بلاغات إساءة الاستخدام
          تستخدم للمراجعة الداخلية ولا تعرض بيانات خاصة للمبلغين.
        </p>
        <p>
          قد يتم استخدام سجلات الزيارة الأساسية للحماية من إساءة الاستخدام
          وتحسين موثوقية الخدمة.
        </p>
        <Link href="/" className="mt-6 inline-block font-bold text-[#006b4f]">
          العودة للرئيسية
        </Link>
      </article>
    </main>
  );
}
