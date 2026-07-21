import { NextResponse } from "next/server";
import { getDownloadTarget } from "@/lib/documents";

/**
 * Force-download a Cloudinary asset with a friendly filename by injecting the
 * `fl_attachment` delivery flag into the URL.
 */
function toDownloadUrl(url: string, fileName: string): string {
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_");
  const flag = `fl_attachment${base ? `:${base}` : ""}`;
  return url.includes("/upload/")
    ? url.replace("/upload/", `/upload/${flag}/`)
    : url;
}

/**
 * Public download: resolves the document and redirects to its Cloudinary URL
 * (as an attachment). Keeping the link indirect means the page exposes a stable
 * URL and the storage URL can change without breaking it.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const target = await getDownloadTarget(id);
    if (!target) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.redirect(
      toDownloadUrl(target.url, target.fileName),
      307,
    );
  } catch (error) {
    console.error("Failed to build download URL:", error);
    return NextResponse.json(
      { message: "Error preparing download" },
      { status: 500 },
    );
  }
}
