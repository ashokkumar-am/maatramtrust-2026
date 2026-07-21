"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";

export interface AnnadhanaCampaignValues {
  id?: string;
  title: string;
  slug?: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  minAmount?: number;
  targetAmount?: number;
  startDate?: string;
  endDate?: string;
  order?: number;
  isActive?: boolean;
}

export function AnnadhanaCampaignForm({
  initial,
}: {
  initial?: AnnadhanaCampaignValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const editing = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [imagePublicId, setImagePublicId] = useState(
    initial?.imagePublicId ?? "",
  );
  const [minAmount, setMinAmount] = useState<number | "">(
    initial?.minAmount ?? 0,
  );
  const [targetAmount, setTargetAmount] = useState<number | "">(
    initial?.targetAmount ?? "",
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [order, setOrder] = useState<number | "">(initial?.order ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  function save() {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      toast.error("The end date must be after the start date.");
      return;
    }

    startTransition(async () => {
      const endpoint = editing
        ? `/api/admin/annadhana/campaigns/${initial!.id}`
        : "/api/admin/annadhana/campaigns";
      // `null` clears a field on update (repository translates null -> $unset).
      const res = await fetch(endpoint, {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          image: image.trim() || null,
          imagePublicId: imagePublicId.trim() || null,
          minAmount: Number(minAmount) || 0,
          targetAmount: targetAmount === "" ? null : Number(targetAmount),
          startDate: startDate || null,
          endDate: endDate || null,
          order: Number(order) || 0,
          isActive,
        }),
      });

      if (res.ok) {
        toast.success(editing ? "Campaign updated." : "Campaign created.");
        router.push("/dashboard/annadhana/campaigns");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      toast.error(
        data.message === "Already exists"
          ? "A campaign with that slug already exists."
          : (data.message ?? "Could not save the campaign."),
      );
    });
  }

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Title</span>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Annadhana Sevai 2026"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Slug (optional)</span>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Derived from the title when left blank"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Description (optional)</span>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <ImageUploadField
        label="Image"
        url={image}
        onChange={(u, id) => {
          setImage(u);
          setImagePublicId(id);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Minimum amount (₹)</span>
          <Input
            type="number"
            min={0}
            value={minAmount}
            onChange={(e) =>
              setMinAmount(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Target amount (optional)</span>
          <Input
            type="number"
            min={1}
            value={targetAmount}
            onChange={(e) =>
              setTargetAmount(
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            placeholder="Fundraising goal"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Opens on (optional)</span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Closes on (optional)</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
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
        Active (open for public bookings)
      </label>

      <div className="mt-2 flex gap-2">
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Create campaign"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/annadhana/campaigns")}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
