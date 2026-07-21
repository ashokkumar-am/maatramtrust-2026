import "server-only";
import { cache } from "react";
import connectMongoDB from "@/lib/mongoose";
import BlogPost from "@/models/BlogModel";
import Category from "@/models/CategoryModel";

/** Category summary embedded in a public post. */
export interface PostCategory {
  name: string;
  slug: string;
}

export interface BlogListItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  tags: string[];
  publishedAt?: Date;
  category: PostCategory | null;
  /** Author's display name (the admin who created the post). */
  author?: string;
}

export interface BlogDetail extends BlogListItem {
  content: string;
}

interface PostDoc {
  _id: unknown;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  publishedAt?: Date;
  category?: { name: string; slug: string } | null;
  createdBy?: { name?: string } | null;
}

function toListItem(doc: PostDoc): BlogListItem {
  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt,
    coverImage: doc.coverImage,
    tags: doc.tags ?? [],
    publishedAt: doc.publishedAt,
    category: doc.category
      ? { name: doc.category.name, slug: doc.category.slug }
      : null,
    author: doc.createdBy?.name,
  };
}

/**
 * Published posts, newest first. Optionally filter to a single category by its
 * slug (returns an empty list when the category slug is unknown).
 */
export async function getPublishedPosts(options?: {
  categorySlug?: string;
  q?: string;
  limit?: number;
  page?: number;
}): Promise<{ items: BlogListItem[]; total: number; page: number }> {
  await connectMongoDB();

  const limit = Math.min(Math.max(1, options?.limit ?? 20), 50);
  const page = Math.max(1, options?.page ?? 1);
  const filter: Record<string, unknown> = { status: "published" };

  if (options?.categorySlug) {
    const category = await Category.findOne({ slug: options.categorySlug })
      .select("_id")
      .lean<{ _id: unknown }>()
      .exec();
    if (!category) return { items: [], total: 0, page };
    filter.category = category._id;
  }

  const q = options?.q?.trim();
  if (q) {
    const rx = {
      $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
    filter.$or = [{ title: rx }, { excerpt: rx }];
  }

  const [docs, total] = await Promise.all([
    BlogPost.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "title slug excerpt coverImage tags publishedAt category createdBy",
      )
      .populate("category", "name slug")
      .lean<PostDoc[]>()
      .exec(),
    BlogPost.countDocuments(filter),
  ]);

  return { items: docs.map(toListItem), total, page };
}

/**
 * Semantic validator for the admin blog API: when a `category` is supplied, it
 * must reference an existing Category. Returns an error message (→ 400) or
 * `null`. `category` is absent on partial updates that don't touch it, so a
 * missing category is treated as valid here.
 */
export async function validateBlogCategoryRef(
  data: Record<string, unknown>,
): Promise<string | null> {
  const category = data.category;
  if (typeof category !== "string") return null;
  await connectMongoDB();
  const exists = await Category.exists({ _id: category });
  return exists ? null : "Category not found";
}

/**
 * A single published post by slug, or `null` when not found/not published.
 * Wrapped in React `cache()` so a page and its `generateMetadata` share one
 * query per request instead of hitting the DB twice.
 */
export const getPublishedPostBySlug = cache(
  async (slug: string): Promise<BlogDetail | null> => {
    await connectMongoDB();
    const doc = await BlogPost.findOne({ slug, status: "published" })
      .select(
        "title slug excerpt content coverImage tags publishedAt category createdBy",
      )
      .populate("category", "name slug")
      .lean<PostDoc>()
      .exec();
    if (!doc) return null;
    return { ...toListItem(doc), content: doc.content ?? "" };
  },
);
