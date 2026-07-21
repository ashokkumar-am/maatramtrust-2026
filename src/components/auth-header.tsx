import Link from "next/link";
import { Heart } from "lucide-react";
import { auth, signIn, signOut } from "@/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { Theme } from "@/lib/theme";

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "?";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function AuthHeader({ theme }: { theme: Theme }) {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <nav className="flex items-center gap-4">
        <Link href="/" className="text-sm font-semibold">
          Maatram
        </Link>
        <Link
          href="/annadhana"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Annadhana
        </Link>
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Blog
        </Link>
        <Link
          href="/about"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          About
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        <Link href="/donate" className={cn(buttonVariants({ size: "sm" }))}>
          <Heart className="size-3" />
          Donate
        </Link>
        <ThemeToggle initialTheme={theme} />
        {user ? (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name ?? "User"} />
              ) : null}
              <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm sm:inline">
              {user.name ?? user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <Button type="submit" size="sm">
              Sign in
            </Button>
          </form>
        )}
      </div>
    </header>
  );
}
