import "server-only";
import connectMongoDB from "@/lib/mongoose";
import Category from "@/models/CategoryModel";

/**
 * Semantic validator for the admin category API: when a `parent` is supplied
 * (non-null), it must reference an existing Category. Returns an error message
 * (→ 400) or `null`. Absent/null parent (top-level, or clearing it) is valid.
 */
export async function validateCategoryParent(
  data: Record<string, unknown>,
): Promise<string | null> {
  const parent = data.parent;
  if (parent == null || typeof parent !== "string") return null;
  await connectMongoDB();
  const exists = await Category.exists({ _id: parent });
  return exists ? null : "Parent category not found";
}
