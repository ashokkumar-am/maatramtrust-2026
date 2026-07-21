import Link from "next/link";
import connectMongoDB from "@/lib/mongoose";
import Category from "@/models/CategoryModel";
import { getPublishedPosts } from "@/lib/blog";
import { cn } from "@/lib/utils";
import { BlogList, type PostItem } from "@/components/blog/blog-list";

export const metadata = {
  title: "Blog · Maatram",
  description: "Stories and updates from Maatram, organized by category.",
};

const PAGE_SIZE = 12;

interface CategoryDoc {
  _id: unknown;
  name: string;
  slug: string;
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: activeSlug } = await searchParams;

  await connectMongoDB();
  const [categories, { items }] = await Promise.all([
    Category.find({ isActive: true, type: "blog" })
      .sort({ order: 1, name: 1 })
      .select("name slug")
      .lean<CategoryDoc[]>()
      .exec(),
    getPublishedPosts({ categorySlug: activeSlug, limit: PAGE_SIZE }),
  ]);

  // Serialize dates for the client component.
  const initialItems: PostItem[] = items.map((post) => ({
    ...post,
    publishedAt: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined,
  }));

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
              href={`/blog?category=${c.slug}`}
              active={activeSlug === c.slug}
            />
          ))}
        </nav>
      )}

      <BlogList
        key={activeSlug ?? "all"}
        initialItems={initialItems}
        categorySlug={activeSlug}
        pageSize={PAGE_SIZE}
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
