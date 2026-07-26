import connectMongoDB from "@/lib/mongoose";
import Category from "@/models/CategoryModel";
import { requireRolePage } from "@/lib/dashboard-auth";
import { BLOG_MANAGER_ROLES } from "@/lib/roles";
import { BlogForm } from "@/components/dashboard/blog-form";

export const metadata = { title: "New post · Maatram Admin" };

interface CategoryDoc {
  _id: unknown;
  name: string;
}

export default async function NewBlogPostPage() {
  await requireRolePage(BLOG_MANAGER_ROLES, "/dashboard/blog/new");
  await connectMongoDB();

  // Only blog-typed categories are assignable — this matches the public /blog
  // filter chips, so every post's category is reachable there.
  const cats = await Category.find({ isActive: true, type: "blog" })
    .sort({ order: 1, name: 1 })
    .select("name")
    .lean<CategoryDoc[]>()
    .exec();

  const categories = cats.map((c) => ({ id: String(c._id), name: c.name }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New post</h1>
      </header>
      <BlogForm categories={categories} />
    </div>
  );
}
