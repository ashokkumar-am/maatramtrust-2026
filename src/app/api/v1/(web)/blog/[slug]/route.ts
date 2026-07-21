import { NextResponse } from "next/server";
import { getPublishedPostBySlug } from "@/lib/blog";

/** Public: a single published post by slug. 404 when unknown or still a draft. */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    const post = await getPublishedPostBySlug(slug);
    if (!post) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    console.error("Failed to load blog post:", error);
    return NextResponse.json(
      { message: "Error loading blog post" },
      { status: 500 },
    );
  }
}
