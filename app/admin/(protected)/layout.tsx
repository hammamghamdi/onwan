import {
  adminSessionCookieName,
  createAdminCsrfToken,
  verifyAdminSessionToken,
} from "@/lib/adminSession";
import { AdminCsrfProvider } from "@/lib/adminClient";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { AdminLogoutButton } from "./AdminLogoutButton";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get(adminSessionCookieName)?.value;

  if (!verifyAdminSessionToken(session)) {
    redirect("/admin/login");
  }

  const csrfToken = createAdminCsrfToken(session!);

  return (
    <AdminCsrfProvider csrfToken={csrfToken}>
      <AdminLogoutButton />
      {children}
    </AdminCsrfProvider>
  );
}
