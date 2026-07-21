import { notFound } from "next/navigation";
import mongoose from "mongoose";
import connectMongoDB from "@/lib/mongoose";
import Category from "@/models/CategoryModel";
import { requireAdminPage } from "@/lib/dashboard-auth";
import {
  CategoryForm,
  type CategoryValues,
} from "@/components/dashboard/category-form";

export const metadata = { title: "Edit category · Maatram Admin" };

interface CategoryDoc {
  _id: unknown;
  name: string;
  slug?: string;
  type?: string;
  parent?: unknown;
  description?: string;
  icon?: string;
  iconPublicId?: string;
  image?: string;
  imagePublicId?: string;
  order?: number;
  isActive?: boolean;
}

interface ParentDoc {
  _id: unknown;
  name: string;
}

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdminPage(`/dashboard/categories/${id}/edit`);

  if (!mongoose.isValidObjectId(id)) notFound();
  await connectMongoDB();
  const doc = await Category.findById(id).lean<CategoryDoc>().exec();
  if (!doc) notFound();

  // Parent options: other top-level categories, excluding this one (no self- or
  // deeper nesting).
  const parentDocs = await Category.find({ parent: null, _id: { $ne: id } })
    .sort({ order: 1, name: 1 })
    .select("name")
    .lean<ParentDoc[]>()
    .exec();
  const parents = parentDocs.map((p) => ({ id: String(p._id), name: p.name }));

  const initial: CategoryValues = {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    type: doc.type,
    parent: doc.parent ? String(doc.parent) : undefined,
    description: doc.description,
    icon: doc.icon,
    iconPublicId: doc.iconPublicId,
    image: doc.image,
    imagePublicId: doc.imagePublicId,
    order: doc.order,
    isActive: doc.isActive,
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Edit category</h1>
      </header>
      <CategoryForm initial={initial} parents={parents} />
    </div>
  );
}
