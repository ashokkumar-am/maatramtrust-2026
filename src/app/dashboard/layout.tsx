import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:flex-row sm:p-6">
      <DashboardNav role={session.user.role} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
