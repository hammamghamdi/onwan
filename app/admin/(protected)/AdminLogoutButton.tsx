"use client";

import { getAdminAuthHeaders } from "@/lib/adminClient";

export function AdminLogoutButton() {
  const logout = async () => {
    const headers = await getAdminAuthHeaders();

    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "same-origin",
      headers,
    });

    window.location.href = "/admin/login";
  };

  return (
    <button
      type="button"
      onClick={logout}
      className="fixed left-4 top-4 z-20 rounded-full border border-red-700 bg-white px-4 py-2 text-sm font-bold text-red-700 shadow-sm"
    >
      تسجيل الخروج
    </button>
  );
}
