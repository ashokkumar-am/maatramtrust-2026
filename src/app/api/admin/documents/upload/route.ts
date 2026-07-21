import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { documentRepository } from "@/lib/resources";
import { documentUploadSchema } from "@/lib/validations";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import type { Doc } from "@/lib/repository";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * Upload a document file (multipart form: `file`, `type`, `year`, `title?`) to
 * Cloudinary via the server SDK and record its metadata. Admin-only.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { message: "Cloudinary is not configured — set CLOUDINARY_API_SECRET." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { message: "Expected multipart form data" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { message: "A file is required." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { message: "File is too large (max 15 MB)." },
      { status: 413 },
    );
  }

  const title = form.get("title");
  const parsed = documentUploadSchema.safeParse({
    type: form.get("type"),
    year: form.get("year"),
    title: typeof title === "string" && title.trim() ? title.trim() : undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await uploadToCloudinary(bytes, {
      folder: `documents/${parsed.data.type}/${parsed.data.year}`,
      filename: file.name,
    });

    const created = await documentRepository.create(
      {
        type: parsed.data.type,
        year: parsed.data.year,
        title: parsed.data.title,
        fileName: file.name,
        url: result.secureUrl,
        publicId: result.publicId,
        resourceType: result.resourceType,
        contentType: file.type || undefined,
        size: result.bytes,
      } as Doc,
      auth.actor,
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[documents] upload failed", error);
    return NextResponse.json(
      { message: "Could not upload the document." },
      { status: 500 },
    );
  }
}
