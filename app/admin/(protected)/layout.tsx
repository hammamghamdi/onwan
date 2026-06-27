import {
  adminSessionCookieName,
  verifyAdminSessionToken,
} from "@/lib/adminSession";
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

  return (
    <>
      <AdminLogoutButton />
      {children}
    </>
  );
}
