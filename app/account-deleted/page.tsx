import Link from "next/link";

export default function AccountDeletedPage() {
  return (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f7f8f5] px-4 text-black">
      <section className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-sm">
        <h1 className="mb-4 text-2xl font-black">تم حذف الحساب بنجاح.</h1>
        <Link
          href="/"
          className="block w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white"
        >
          العودة للرئيسية
        </Link>
      </section>
    </main>
  );
}
