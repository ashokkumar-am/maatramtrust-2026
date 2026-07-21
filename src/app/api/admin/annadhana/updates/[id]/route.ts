import { after } from "next/server";
import { itemHandlers } from "@/lib/crud-route";
import { annadhanaUpdateRepository } from "@/lib/resources";
import { annadhanaUpdateUpdateSchema } from "@/lib/validations";
import { destroyCloudinaryAsset } from "@/lib/cloudinary";
import type { Doc } from "@/lib/repository";

interface MediaItem {
  publicId?: string;
  mediaType?: "image" | "video";
}

const asMedia = (doc: Doc | null): MediaItem[] =>
  Array.isArray(doc?.media) ? (doc.media as MediaItem[]) : [];

/** Best-effort, non-blocking Cloudinary delete of gallery assets. */
function cleanupMedia(items: MediaItem[]): void {
  const removable = items.filter((m) => m.publicId);
  if (removable.length === 0) return;
  after(async () => {
    for (const item of removable) {
      try {
        await destroyCloudinaryAsset(
          item.publicId as string,
          item.mediaType === "video" ? "video" : "image",
        );
      } catch (error) {
        console.error("[annadhana] media cleanup failed", error);
      }
    }
  });
}

export const { GET, PATCH, DELETE } = itemHandlers(
  annadhanaUpdateRepository,
  annadhanaUpdateUpdateSchema,
  {
    // Remove all gallery assets when the update is deleted.
    afterDelete: (doc) => cleanupMedia(asMedia(doc)),

    // Remove assets the new gallery no longer references.
    afterUpdate: (updated, previous) => {
      const kept = new Set(
        asMedia(updated)
          .map((m) => m.publicId)
          .filter(Boolean),
      );
      cleanupMedia(
        asMedia(previous).filter((m) => m.publicId && !kept.has(m.publicId)),
      );
    },
  },
);
