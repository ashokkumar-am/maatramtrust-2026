import { getBlogCategories, getPublishedPosts } from "@/lib/blog";
import { BlogIndex, BLOG_PAGE_SIZE } from "@/components/blog/blog-index";

export const metadata = {
  title: "Blog · Maatram",
  description: "Stories and updates from Maatram, organized by category.",
};

export default async function BlogPage() {
  const [categories, { items }] = await Promise.all([
    getBlogCategories(),
    getPublishedPosts({ limit: BLOG_PAGE_SIZE }),
  ]);

  return <BlogIndex categories={categories} items={items} />;
}
