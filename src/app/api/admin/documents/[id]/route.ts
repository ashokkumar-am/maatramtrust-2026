import { after } from "next/server";
import { itemHandlers } from "@/lib/crud-route";
import { documentRepository } from "@/lib/resources";
import { documentUpdateSchema } from "@/lib/validations";
import {
  destroyCloudinaryAsset,
  type CloudinaryResourceType,
} from "@/lib/cloudinary";

function cleanupAsset(publicId: unknown, resourceType: unknown): void {
  if (typeof publicId !== "string" || !publicId) return;
  const type = (
    resourceType === "image" || resourceType === "video" ? resourceType : "raw"
  ) as CloudinaryResourceType;
  after(async () => {
    try {
      await destroyCloudinaryAsset(publicId, type);
    } catch (error) {
      console.error("[documents] Cloudinary cleanup failed", error);
    }
  });
}

export const { GET, PATCH, DELETE } = itemHandlers(
  documentRepository,
  documentUpdateSchema,
  {
    // Remove the Cloudinary asset after the record is deleted (best-effort).
    afterDelete: (doc) => cleanupAsset(doc.publicId, doc.resourceType),
    // Remove the previous asset when an update replaces it.
    afterUpdate: (updated, previous) => {
      const oldId = previous?.publicId;
      if (typeof oldId === "string" && oldId && oldId !== updated.publicId) {
        cleanupAsset(oldId, previous?.resourceType);
      }
    },
  },
);
