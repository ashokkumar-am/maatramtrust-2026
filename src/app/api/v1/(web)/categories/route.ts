import connectMongoDB from "@/lib/mongoose";
import Category from "@/models/CategoryModel";
import { NextResponse } from "next/server";

/**
 * Public categories: only active ones, ordered by `order` then name. Filters:
 * `?type=` narrows to a namespace (e.g. blog); `?parent=<id>` returns that
 * category's sub-categories, `?parent=none` returns only top-level categories.
 */
export async function GET(request: Request) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const parent = searchParams.get("parent");

    const filter: Record<string, unknown> = { isActive: true };
    if (type) filter.type = type;
    if (parent === "none" || parent === "null") filter.parent = null;
    else if (parent) filter.parent = parent;

    const categories = await Category.find(filter)
      .sort({ order: 1, name: 1 })
      .select("name slug type parent description icon image order")
      .lean()
      .exec();

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to load categories:", error);
    return NextResponse.json(
      { message: "Error loading categories" },
      { status: 500 },
    );
  }
}
