import Link from "next/link";

export default function AcceptableUsePage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-5 py-8 text-black">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 leading-8 shadow-sm">
        <h1 className="mb-4 text-3xl font-black">سياسة الاستخدام المقبول</h1>
        <p>
          يجب أن تكون العناوين المنشورة عبر Onwan صحيحة، آمنة، وغير مضللة.
        </p>
        <p>
          يمنع استخدام الخدمة في أي نشاط غير قانوني، أو انتحال شخصية، أو نشر
          عناوين مضللة، أو محتوى ضار، أو روابط تهدف إلى الاحتيال أو الإزعاج.
        </p>
        <p>
          يمكن لـ Onwan تعليق العناوين المخالفة مؤقتًا أو دائمًا عند وجود بلاغ
          أو مؤشرات إساءة استخدام.
        </p>
        <Link href="/" className="mt-6 inline-block font-bold text-[#006b4f]">
          العودة للرئيسية
        </Link>
      </article>
    </main>
  );
}
