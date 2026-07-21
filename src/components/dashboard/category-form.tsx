"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";

export interface CategoryValues {
  id?: string;
  name: string;
  slug?: string;
  type?: string;
  parent?: string;
  description?: string;
  icon?: string;
  iconPublicId?: string;
  image?: string;
  imagePublicId?: string;
  order?: number;
  isActive?: boolean;
}

export interface CategoryOption {
  id: string;
  name: string;
}

export function CategoryForm({
  initial,
  parents,
}: {
  initial?: CategoryValues;
  parents: CategoryOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const editing = Boolean(initial?.id);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [type, setType] = useState(initial?.type ?? "");
  const [parent, setParent] = useState(initial?.parent ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [iconPublicId, setIconPublicId] = useState(initial?.iconPublicId ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [imagePublicId, setImagePublicId] = useState(
    initial?.imagePublicId ?? "",
  );
  const [order, setOrder] = useState<number | "">(initial?.order ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  function save() {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }

    startTransition(async () => {
      const endpoint = editing
        ? `/api/admin/categories/${initial!.id}`
        : "/api/admin/categories";
      // `null` clears a field on update (repository translates null -> $unset).
      const res = await fetch(endpoint, {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          type: type.trim() || undefined,
          parent: parent || null,
          description: description.trim() || undefined,
          icon: icon.trim() || null,
          iconPublicId: iconPublicId.trim() || null,
          image: image.trim() || null,
          imagePublicId: imagePublicId.trim() || null,
          order: Number(order) || 0,
          isActive,
        }),
      });

      if (res.ok) {
        toast.success(editing ? "Category updated." : "Category created.");
        router.push("/dashboard/categories");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      toast.error(
        data.message === "Already exists"
          ? "A category with that slug already exists."
          : (data.message ?? "Could not save the category."),
      );
    });
  }

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Name</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Parent (optional)</span>
          <select
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          >
            <option value="">None (top-level)</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            Type / namespace (optional)
          </span>
          <Input
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="e.g. blog, donation"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Slug (optional)</span>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Derived from the name when left blank"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Description (optional)</span>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUploadField
          label="Icon"
          url={icon}
          onChange={(u, id) => {
            setIcon(u);
            setIconPublicId(id);
          }}
        />
        <ImageUploadField
          label="Image"
          url={image}
          onChange={(u, id) => {
            setImage(u);
            setImagePublicId(id);
          }}
        />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Order</span>
        <Input
          type="number"
          value={order}
          onChange={(e) =>
            setOrder(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="w-32"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="size-4 accent-[#0a7d3e]"
        />
        Active (visible publicly)
      </label>

      <div className="mt-2 flex gap-2">
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Create category"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/categories")}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
