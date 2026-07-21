import { after } from "next/server";
import { itemHandlers } from "@/lib/crud-route";
import { bannerRepository } from "@/lib/resources";
import { bannerUpdateSchema } from "@/lib/validations";
import { destroyCloudinaryAsset } from "@/lib/cloudinary";

/** Best-effort, non-blocking Cloudinary delete of a banner asset. */
function cleanupAsset(publicId: unknown, mediaType: unknown): void {
  if (typeof publicId !== "string" || !publicId) return;
  const resourceType = mediaType === "video" ? "video" : "image";
  after(async () => {
    try {
      await destroyCloudinaryAsset(publicId, resourceType);
    } catch (error) {
      console.error("[banners] cloudinary cleanup failed", error);
    }
  });
}

export const { GET, PATCH, DELETE } = itemHandlers(
  bannerRepository,
  bannerUpdateSchema,
  {
    // Delete the asset when the banner is deleted.
    afterDelete: (banner) => cleanupAsset(banner.public_id, banner.mediaType),
    // Delete the previous asset when an update swaps it out.
    afterUpdate: (updated, previous) => {
      const oldId = previous?.public_id;
      if (typeof oldId === "string" && oldId && oldId !== updated.public_id) {
        cleanupAsset(oldId, previous?.mediaType);
      }
    },
  },
);
