import Link from "next/link";
import { Heart } from "lucide-react";
import { auth, signIn, signOut } from "@/auth";
import { MobileNav, type NavLink } from "@/components/mobile-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { Theme } from "@/lib/theme";

const NAV_LINKS: NavLink[] = [
  { label: "Students", href: "/students" },
  { label: "Annadhana", href: "/annadhana" },
  { label: "Programs", href: "/programs" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const MOBILE_LINKS: NavLink[] = [{ label: "Home", href: "/" }, ...NAV_LINKS];

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "?";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SignOutForm({ className }: { className?: string }) {
  return (
    <form
      className={className}
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <Button type="submit" variant="outline" size="sm" className="w-full">
        Sign out
      </Button>
    </form>
  );
}

/**
 * Floating pill header (sticky, blurred) with the primary nav; collapses to a
 * hamburger sheet below `lg`.
 */
export async function AuthHeader({ theme }: { theme: Theme }) {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <header className="bg-background/90 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 shadow-sm backdrop-blur-md sm:px-5">
        <nav className="flex items-center gap-5">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Maatram
          </Link>
          <div className="hidden items-center gap-5 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/donate"
            className={cn(
              buttonVariants({ size: "sm" }),
              "rounded-full max-sm:hidden",
            )}
          >
            <Heart className="size-3" />
            Donate
          </Link>
          <div className="hidden sm:block">
            <ThemeToggle initialTheme={theme} />
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Avatar className="size-8">
                {user.image ? (
                  <AvatarImage src={user.image} alt={user.name ?? "User"} />
                ) : null}
                <AvatarFallback>
                  {initials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <SignOutForm className="hidden lg:block" />
            </div>
          ) : (
            <form
              className="hidden lg:block"
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <Button type="submit" size="sm" variant="outline">
                Sign in
              </Button>
            </form>
          )}

          <MobileNav
            links={MOBILE_LINKS}
            authSlot={
              user ? (
                <SignOutForm />
              ) : (
                <form
                  action={async () => {
                    "use server";
                    await signIn("google", { redirectTo: "/" });
                  }}
                >
                  <Button
                    type="submit"
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    Sign in with Google
                  </Button>
                </form>
              )
            }
          />
        </div>
      </header>
    </div>
  );
}
