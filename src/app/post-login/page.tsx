import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { safeCallbackUrl } from "@/lib/safe-redirect";

/**
 * Role-aware hop right after sign-in: admins continue to the dashboard,
 * everyone else returns to where they were headed (`?to=`, default home).
 */
export default async function PostLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const [{ to }, session] = await Promise.all([searchParams, auth()]);
  if (!session?.user) redirect("/login");

  redirect(session.user.role === "admin" ? "/dashboard" : safeCallbackUrl(to));
}
