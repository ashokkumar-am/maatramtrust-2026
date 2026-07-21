import { after } from "next/server";
import { itemHandlers } from "@/lib/crud-route";
import { annadhanaCampaignRepository } from "@/lib/resources";
import { annadhanaCampaignUpdateSchema } from "@/lib/validations";
import {
  countBookingsForCampaign,
  countUpdatesForCampaign,
} from "@/lib/annadhana";
import { destroyCloudinaryAsset } from "@/lib/cloudinary";

/** Best-effort, non-blocking Cloudinary delete of a campaign image asset. */
function cleanupImage(publicId: unknown): void {
  if (typeof publicId !== "string" || !publicId) return;
  after(async () => {
    try {
      await destroyCloudinaryAsset(publicId, "image");
    } catch (error) {
      console.error("[annadhana] cloudinary cleanup failed", error);
    }
  });
}

export const { GET, PATCH, DELETE } = itemHandlers(
  annadhanaCampaignRepository,
  annadhanaCampaignUpdateSchema,
  {
    // Keep the booking ledger and posted history intact: a campaign with
    // bookings or daily updates can only be deactivated, never deleted
    // (deleting would also strand the updates' Cloudinary media).
    beforeDelete: async (id) => {
      const [bookings, updates] = await Promise.all([
        countBookingsForCampaign(id),
        countUpdatesForCampaign(id),
      ]);
      if (bookings > 0) {
        return "This campaign has bookings. Deactivate it instead.";
      }
      if (updates > 0) {
        return "This campaign has daily updates. Delete them first or deactivate the campaign.";
      }
      return null;
    },

    // Remove the image asset when the campaign is deleted.
    afterDelete: (campaign) => cleanupImage(campaign.imagePublicId),

    // Remove a previous image when an update replaces or clears it.
    afterUpdate: (updated, previous) => {
      const oldImage = previous?.imagePublicId;
      if (
        typeof oldImage === "string" &&
        oldImage &&
        oldImage !== updated.imagePublicId
      ) {
        cleanupImage(oldImage);
      }
    },
  },
);
