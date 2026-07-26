import Link from "next/link";
import { Plus } from "lucide-react";
import connectMongoDB from "@/lib/mongoose";
import BlogPost from "@/models/BlogModel";
import Category from "@/models/CategoryModel";
import { requireRolePage } from "@/lib/dashboard-auth";
import { BLOG_MANAGER_ROLES } from "@/lib/roles";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AdminBlogList,
  type AdminBlogRow,
} from "@/components/dashboard/admin-blog-list";

export const metadata = { title: "Blog · Maatram Admin" };

const PAGE_SIZE = 20;

interface PostDoc {
  _id: unknown;
  title: string;
  status?: string;
  publishedAt?: Date;
  category?: unknown;
}

interface CategoryDoc {
  _id: unknown;
  name: string;
}

export default async function AdminBlogPage() {
  await requireRolePage(BLOG_MANAGER_ROLES, "/dashboard/blog");
  await connectMongoDB();

  const [docs, total, cats] = await Promise.all([
    BlogPost.find()
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE)
      .select("title status publishedAt category")
      .lean<PostDoc[]>()
      .exec(),
    BlogPost.estimatedDocumentCount(),
    Category.find().select("name").lean<CategoryDoc[]>().exec(),
  ]);

  const categoryNames = Object.fromEntries(
    cats.map((c) => [String(c._id), c.name]),
  );

  const initialItems: AdminBlogRow[] = docs.map((d) => ({
    id: String(d._id),
    title: d.title,
    status: d.status,
    publishedAt: d.publishedAt
      ? new Date(d.publishedAt).toISOString()
      : undefined,
    categoryId: d.category ? String(d.category) : undefined,
  }));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
          <p className="text-muted-foreground mt-1 text-sm">{total} posts.</p>
        </div>
        <Link
          href="/dashboard/blog/new"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          <Plus className="size-3" />
          New post
        </Link>
      </header>

      <AdminBlogList
        initialItems={initialItems}
        categoryNames={categoryNames}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
