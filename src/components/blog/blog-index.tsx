import type { PostCategory, BlogListItem } from "@/lib/blog";
import { BlogList, type PostItem } from "@/components/blog/blog-list";
import { CategoryDropdown } from "@/components/blog/category-dropdown";

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
 * Shared blog listing: heading, category dropdown filter, and the
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
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
          <p className="text-muted-foreground mt-2">
            Stories and updates from Maatram.
          </p>
        </div>
        {categories.length > 0 && (
          <CategoryDropdown categories={categories} activeSlug={activeSlug} />
        )}
      </header>

      <BlogList
        key={activeSlug ?? "all"}
        initialItems={toPostItems(items)}
        categorySlug={activeSlug}
        pageSize={BLOG_PAGE_SIZE}
      />
    </main>
  );
}
