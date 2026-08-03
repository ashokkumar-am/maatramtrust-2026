import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { safeCallbackUrl } from "@/lib/safe-redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const target = safeCallbackUrl(callbackUrl);

  // Already signed in — no reason to show the login screen.
  const session = await auth();
  if (session?.user) {
    redirect(target);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-muted-foreground text-sm">
          Continue with your Google account to access Maatram.
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          // Via /post-login so admins land on the dashboard, others on target.
          await signIn("google", {
            redirectTo: `/post-login?to=${encodeURIComponent(target)}`,
          });
        }}
      >
        <Button type="submit" size="lg">
          Continue with Google
        </Button>
      </form>
    </main>
  );
}
