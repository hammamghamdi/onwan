import Link from "next/link";

export default function AcceptableUsePage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-5 py-8 text-black">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 leading-8 shadow-sm">
        <h1 className="mb-4 text-3xl font-black">سياسة الاستخدام المقبول</h1>
        <p>
          يجب أن تكون العناوين المنشورة عبر Onwan صحيحة، آمنة، وغير مضللة، وأن
          يكون لدى المستخدم صلاحية نشر بيانات الموقع والصور والتعليمات.
        </p>
        <p>
          يمنع استخدام Onwan في الأنشطة غير القانونية، الاحتيال أو الخداع،
          انتحال الشخصية، نشر عناوين مضللة، أو نشر عنوان شخص آخر دون إذن أو
          صلاحية واضحة.
        </p>
        <p>
          يمنع نشر محتوى ضار أو مسيء أو مهدد، أو استخدام الخدمة لتسهيل سلع أو
          خدمات محظورة، أو أي نشاط قد يسبب ضررًا للآخرين أو يخالف الأنظمة.
        </p>
        <p>
          قد تؤدي المخالفات إلى تعليق العنوان أو إزالته، وقد يتم تقييد الوصول إلى
          الحساب أو مراجعة البلاغات المرتبطة به وفق تقدير Onwan.
        </p>
        <Link href="/" className="mt-6 inline-block font-bold text-[#006b4f]">
          العودة للرئيسية
        </Link>
      </article>
    </main>
  );
}
