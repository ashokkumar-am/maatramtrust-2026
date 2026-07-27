import Link from "next/link";
import { Heart } from "lucide-react";
import { auth, signIn, signOut } from "@/auth";
import { getBlogCategories } from "@/lib/blog";
import { BlogNavMenu } from "@/components/blog-nav-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { Theme } from "@/lib/theme";

/** "Blog" nav item: plain link without categories, dropdown menu with. */
function BlogNavItem({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  if (categories.length === 0) {
    return (
      <Link
        href="/blog"
        className="text-muted-foreground hover:text-foreground text-sm"
      >
        Blog
      </Link>
    );
  }
  return <BlogNavMenu categories={categories} />;
}

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "?";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function AuthHeader({ theme }: { theme: Theme }) {
  const [session, blogCategories] = await Promise.all([
    auth(),
    getBlogCategories(),
  ]);
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
        <BlogNavItem categories={blogCategories} />
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
