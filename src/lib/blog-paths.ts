// Client-safe blog URL helpers (no server-only imports — used by both
// server pages and the client-side blog list).

/** Path segment used when a post has no category. */
export const UNCATEGORIZED_SLUG = "general";

/** Canonical URL for a published post: `/blog/{category}/{slug}`. */
export function postPath(post: {
  slug: string;
  category?: { slug: string } | null;
}): string {
  return `/blog/${post.category?.slug ?? UNCATEGORIZED_SLUG}/${post.slug}`;
}

/** URL for a category's post listing. */
export function categoryPath(slug: string): string {
  return `/blog/${slug}`;
}
