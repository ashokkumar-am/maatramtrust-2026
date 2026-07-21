import connectMongoDB from "@/lib/mongoose";
import Category from "@/models/CategoryModel";
import { requireAdminPage } from "@/lib/dashboard-auth";
import { CategoryForm } from "@/components/dashboard/category-form";

export const metadata = { title: "New category · Maatram Admin" };

interface ParentDoc {
  _id: unknown;
  name: string;
}

export default async function NewCategoryPage() {
  await requireAdminPage("/dashboard/categories/new");
  await connectMongoDB();

  // Only top-level categories can be a parent (one level of nesting).
  const parentDocs = await Category.find({ parent: null })
    .sort({ order: 1, name: 1 })
    .select("name")
    .lean<ParentDoc[]>()
    .exec();

  const parents = parentDocs.map((p) => ({ id: String(p._id), name: p.name }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New category</h1>
      </header>
      <CategoryForm parents={parents} />
    </div>
  );
}
