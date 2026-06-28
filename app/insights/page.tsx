import {
  adminSessionCookieName,
  verifyAdminSessionToken,
} from "@/lib/adminSession";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function InsightsPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(adminSessionCookieName)?.value;

  if (!verifyAdminSessionToken(session)) {
    redirect("/admin/login");
  }

  redirect("/admin/analytics");
}
