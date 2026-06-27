"use client";

import { getAdminAuthHeaders } from "@/lib/adminClient";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async () => {
      const headers = await getAdminAuthHeaders();

      if (!isMounted) return;

      if (!headers) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/admin/me", { headers });

      if (!isMounted) return;

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setBlocked(true);
        setLoading(false);
        return;
      }

      setAllowed(true);
      setLoading(false);
    };

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f7f8f5] p-6 text-black">
        <div className="mx-auto max-w-sm rounded-2xl bg-white p-5 text-center font-bold shadow-sm">
          جاري التحقق...
        </div>
      </main>
    );
  }

  if (blocked) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f7f8f5] p-6 text-black">
        <div className="mx-auto max-w-sm rounded-2xl bg-white p-5 text-center font-bold text-red-700 shadow-sm">
          غير مصرح لك بالوصول.
        </div>
      </main>
    );
  }

  return allowed ? children : null;
}
