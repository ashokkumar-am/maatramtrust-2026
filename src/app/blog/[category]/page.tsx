import { notFound, permanentRedirect } from "next/navigation";
import {
  getBlogCategories,
  getPublishedPosts,
  getPublishedPostBySlug,
} from "@/lib/blog";
import { postPath } from "@/lib/blog-paths";
import { BlogIndex, BLOG_PAGE_SIZE } from "@/components/blog/blog-index";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const active = (await getBlogCategories()).find((c) => c.slug === category);
  if (!active) return { title: "Blog · Maatram" };
  return {
    title: `${active.name} · Blog · Maatram`,
    description: `Stories and updates from Maatram in ${active.name}.`,
  };
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categories = await getBlogCategories();
  const active = categories.find((c) => c.slug === category);

  if (!active) {
    // Back-compat: post URLs used to be /blog/{slug} — send old links to the
    // canonical /blog/{category}/{slug}.
    const post = await getPublishedPostBySlug(category);
    if (post) permanentRedirect(postPath(post));
    notFound();
  }

  const { items } = await getPublishedPosts({
    categorySlug: active.slug,
    limit: BLOG_PAGE_SIZE,
  });

  return (
    <BlogIndex categories={categories} activeSlug={active.slug} items={items} />
  );
}
