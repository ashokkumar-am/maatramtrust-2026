import { notFound } from "next/navigation";
import mongoose from "mongoose";
import connectMongoDB from "@/lib/mongoose";
import Category from "@/models/CategoryModel";
import BlogPost from "@/models/BlogModel";
import { requireAdminPage } from "@/lib/dashboard-auth";
import { BlogForm, type BlogValues } from "@/components/dashboard/blog-form";

export const metadata = { title: "Edit post · Maatram Admin" };

interface CategoryDoc {
  _id: unknown;
  name: string;
}

interface PostDoc {
  _id: unknown;
  title: string;
  category?: unknown;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  coverPublicId?: string;
  tags?: string[];
  status?: string;
  publishedAt?: Date;
}

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdminPage(`/dashboard/blog/${id}/edit`);

  if (!mongoose.isValidObjectId(id)) notFound();
  await connectMongoDB();

  const post = await BlogPost.findById(id).lean<PostDoc>().exec();
  if (!post) notFound();

  // Offer blog-typed categories (matching the public filter), but always keep
  // this post's current category selectable so editing never reassigns it.
  const cats = await Category.find({
    isActive: true,
    $or: [{ type: "blog" }, ...(post.category ? [{ _id: post.category }] : [])],
  })
    .sort({ order: 1, name: 1 })
    .select("name")
    .lean<CategoryDoc[]>()
    .exec();

  const categories = cats.map((c) => ({ id: String(c._id), name: c.name }));

  const initial: BlogValues = {
    id: String(post._id),
    title: post.title,
    category: post.category ? String(post.category) : undefined,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    coverPublicId: post.coverPublicId,
    tags: post.tags,
    status: post.status,
    publishedAt: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined,
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Edit post</h1>
      </header>
      <BlogForm categories={categories} initial={initial} />
    </div>
  );
}
