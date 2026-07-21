"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MediaGalleryField,
  type GalleryMedia,
} from "@/components/dashboard/media-gallery-field";

export interface AnnadhanaUpdateValues {
  id?: string;
  campaignId: string;
  date: string; // yyyy-MM-dd
  title?: string;
  description?: string;
  media: GalleryMedia[];
  isActive?: boolean;
}

export interface UpdateCampaignOption {
  id: string;
  title: string;
}

const selectClass =
  "border-input bg-background h-9 rounded-md border px-3 text-sm";

export function AnnadhanaUpdateForm({
  initial,
  campaigns,
}: {
  initial?: AnnadhanaUpdateValues;
  campaigns: UpdateCampaignOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const editing = Boolean(initial?.id);

  // Local calendar date (toISOString would give the UTC day — yesterday for
  // an IST admin shortly after midnight).
  const today = format(new Date(), "yyyy-MM-dd");
  const [campaignId, setCampaignId] = useState(
    initial?.campaignId ?? campaigns[0]?.id ?? "",
  );
  const [date, setDate] = useState(initial?.date ?? today);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [media, setMedia] = useState<GalleryMedia[]>(initial?.media ?? []);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  function save() {
    if (!campaignId) {
      toast.error("Pick a campaign.");
      return;
    }
    if (!date) {
      toast.error("Pick the day this update covers.");
      return;
    }

    startTransition(async () => {
      const endpoint = editing
        ? `/api/admin/annadhana/updates/${initial!.id}`
        : "/api/admin/annadhana/updates";
      // On edit, an emptied field is sent as null so the API clears it
      // (omitted keys are left untouched by the repository).
      const cleared = editing ? null : undefined;
      const payload: Record<string, unknown> = {
        date,
        title: title.trim() || cleared,
        description: description.trim() || cleared,
        media,
        isActive,
      };
      // The campaign is fixed once posted; only sent on create.
      if (!editing) payload.campaignId = campaignId;

      const res = await fetch(endpoint, {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editing ? "Update saved." : "Day posted.");
        router.push("/dashboard/annadhana/updates");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      toast.error(data.message ?? "Could not save the update.");
    });
  }

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Campaign</span>
          <select
            className={selectClass}
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            disabled={editing}
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Day</span>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Title (optional)</span>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Day 12 — Sunday breakfast"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Description (optional)</span>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A line about the day"
        />
      </label>

      <MediaGalleryField
        label="Photos / videos"
        media={media}
        onAdd={(item) => setMedia((prev) => [...prev, item])}
        onRemove={(index) =>
          setMedia((prev) => prev.filter((_, i) => i !== index))
        }
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="size-4 accent-[#0a7d3e]"
        />
        Visible on the public campaign feed
      </label>

      <div className="mt-2 flex gap-2">
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Post the day"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/annadhana/updates")}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
