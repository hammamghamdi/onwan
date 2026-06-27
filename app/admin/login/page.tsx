"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      setError("بيانات الدخول غير صحيحة.");
      return;
    }

    router.replace("/admin");
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-4 py-10 text-black">
      <section className="mx-auto max-w-sm rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="mb-5 text-center text-2xl font-black">دخول لوحة الإدارة</h1>

        <form onSubmit={submit}>
          <label className="mb-2 block font-bold text-black">
            البريد الإلكتروني
          </label>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mb-4 w-full rounded-xl border p-4 text-black"
            autoComplete="username"
            required
          />

          <label className="mb-2 block font-bold text-black">كلمة المرور</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mb-4 w-full rounded-xl border p-4 text-black"
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="mb-4 rounded-xl bg-red-100 p-3 text-center font-bold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "دخول لوحة الإدارة"}
          </button>
        </form>
      </section>
    </main>
  );
}
