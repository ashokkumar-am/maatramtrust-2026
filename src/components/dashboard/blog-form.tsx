"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface BlogCategoryOption {
  id: string;
  name: string;
}

export interface BlogValues {
  id?: string;
  title?: string;
  category?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  coverPublicId?: string;
  tags?: string[];
  status?: string;
  publishedAt?: string;
}

const selectClass =
  "border-input bg-background h-9 rounded-md border px-3 text-sm";

const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const cloudinaryEnabled = Boolean(UPLOAD_PRESET && CLOUD_NAME);

export function BlogForm({
  categories,
  initial,
}: {
  categories: BlogCategoryOption[];
  initial?: BlogValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const editing = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(
    initial?.category ?? categories[0]?.id ?? "",
  );
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [coverPublicId, setCoverPublicId] = useState(
    initial?.coverPublicId ?? "",
  );
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [status, setStatus] = useState(initial?.status ?? "draft");

  function submit(nextStatus: "draft" | "published") {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!category) {
      toast.error("Pick a category (create one first if the list is empty).");
      return;
    }
    if (!content.trim()) {
      toast.error("Content is required.");
      return;
    }

    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    // `null` (not undefined) clears an optional field on update; the repository
    // translates null -> $unset. publishedAt is stamped server-side (zod on
    // create, a model hook on publish-via-update), so the form never sends it.
    const payload: Record<string, unknown> = {
      title: title.trim(),
      category,
      excerpt: excerpt.trim() || null,
      content: content.trim(),
      coverImage: coverImage.trim() || null,
      coverPublicId: coverPublicId.trim() || null,
      tags: tagList,
      status: nextStatus,
    };

    startTransition(async () => {
      const url = editing
        ? `/api/admin/blog/${initial!.id}`
        : "/api/admin/blog";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatus(nextStatus);
        toast.success(
          nextStatus === "published" ? "Post published." : "Draft saved.",
        );
        router.push("/dashboard/blog");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      toast.error(
        data.message === "Already exists"
          ? "A post with that slug already exists."
          : (data.message ?? "Could not save the post."),
      );
    });
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Title</span>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Category</span>
          {categories.length === 0 ? (
            <span className="text-muted-foreground text-sm">
              No categories yet — create one under Categories first.
            </span>
          ) : (
            <select
              className={selectClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Status</span>
          <select
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Excerpt (optional)</span>
        <Input
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short summary shown in listings"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">
          Content{" "}
          <span className="text-muted-foreground font-normal">
            (Markdown supported)
          </span>
        </span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          placeholder="Write your post… **bold**, _italic_, # headings, - lists"
          className="border-input bg-background min-h-48 rounded-md border p-3 font-mono text-sm"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Cover image (optional)</span>
        {coverImage ? (
          <div className="relative w-full max-w-sm overflow-hidden rounded-lg border">
            <Image
              src={coverImage}
              alt="Cover preview"
              width={640}
              height={360}
              className="h-40 w-full object-cover"
              unoptimized
            />
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="absolute top-2 right-2"
              onClick={() => {
                setCoverImage("");
                setCoverPublicId("");
              }}
              aria-label="Remove cover"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : cloudinaryEnabled ? (
          <CldUploadWidget
            uploadPreset={UPLOAD_PRESET}
            onSuccess={(result) => {
              const info = result.info;
              if (info && typeof info === "object") {
                setCoverImage(info.secure_url);
                setCoverPublicId(info.public_id);
              }
            }}
          >
            {({ open }) => (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => open()}
                className="w-fit"
              >
                <ImagePlus className="size-3.5" />
                Upload cover
              </Button>
            )}
          </CldUploadWidget>
        ) : (
          <Input
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://… (paste an image URL)"
          />
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Tags (comma-separated)</span>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="education, impact"
        />
      </label>

      <div className="mt-2 flex gap-2">
        <Button
          variant="outline"
          onClick={() => submit("draft")}
          disabled={pending}
        >
          Save draft
        </Button>
        <Button onClick={() => submit("published")} disabled={pending}>
          {pending ? "Saving…" : "Publish"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/blog")}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
