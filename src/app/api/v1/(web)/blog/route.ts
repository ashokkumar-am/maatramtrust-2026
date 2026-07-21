import { NextResponse } from "next/server";
import { getPublishedPosts } from "@/lib/blog";

/**
 * Public: published blog posts, newest first. Optional `?category=<slug>` to
 * filter by category, and `?page` / `?limit` (1–50) for pagination.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category") ?? undefined;
    const q = searchParams.get("q") ?? undefined;
    const limit = Number(searchParams.get("limit"));
    const page = Number(searchParams.get("page"));

    const result = await getPublishedPosts({
      categorySlug,
      q,
      limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
      page: Number.isFinite(page) && page > 0 ? page : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to load blog posts:", error);
    return NextResponse.json(
      { message: "Error loading blog posts" },
      { status: 500 },
    );
  }
}
