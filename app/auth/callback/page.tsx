"use client";

import { getSafeInternalRedirect } from "@/lib/safeRedirect";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeInternalRedirect(searchParams.get("next"));

  useEffect(() => {
    let isMounted = true;

    const completeLogin = async () => {
      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.log(error);
        }
      }

      if (isMounted) {
        router.replace(nextPath);
      }
    };

    completeLogin();

    return () => {
      isMounted = false;
    };
  }, [nextPath, router, searchParams]);

  return (
    <main
      dir="rtl"
      className="grid min-h-screen place-items-center bg-[#f7f8f5] px-4 text-black"
    >
      <div className="rounded-3xl bg-white p-6 text-center font-bold shadow-sm">
        جاري تسجيل الدخول...
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackContent />
    </Suspense>
  );
}
