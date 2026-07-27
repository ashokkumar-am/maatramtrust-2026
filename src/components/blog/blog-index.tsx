import Link from "next/link";
import type { PostCategory, BlogListItem } from "@/lib/blog";
import { categoryPath } from "@/lib/blog-paths";
import { cn } from "@/lib/utils";
import { BlogList, type PostItem } from "@/components/blog/blog-list";

export const BLOG_PAGE_SIZE = 12;

/** Serialize dates for the client component. */
function toPostItems(items: BlogListItem[]): PostItem[] {
  return items.map((post) => ({
    ...post,
    publishedAt: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined,
  }));
}

/**
 * Shared blog listing: heading, category filter chips, and the
 * infinite-scroll post grid. Used by `/blog` and `/blog/[category]`.
 */
export function BlogIndex({
  categories,
  activeSlug,
  items,
}: {
  categories: PostCategory[];
  activeSlug?: string;
  items: BlogListItem[];
}) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
        <p className="text-muted-foreground mt-2">
          Stories and updates from Maatram.
        </p>
      </header>

      {categories.length > 0 && (
        <nav className="mb-8 flex flex-wrap gap-2">
          <FilterChip label="All" href="/blog" active={!activeSlug} />
          {categories.map((c) => (
            <FilterChip
              key={c.slug}
              label={c.name}
              href={categoryPath(c.slug)}
              active={activeSlug === c.slug}
            />
          ))}
        </nav>
      )}

      <BlogList
        key={activeSlug ?? "all"}
        initialItems={toPostItems(items)}
        categorySlug={activeSlug}
        pageSize={BLOG_PAGE_SIZE}
      />
    </main>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-[#0a7d3e] bg-[#0a7d3e] text-white"
          : "text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
