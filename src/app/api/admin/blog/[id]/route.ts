import { after } from "next/server";
import { itemHandlers } from "@/lib/crud-route";
import { blogRepository } from "@/lib/resources";
import { validateBlogCategoryRef } from "@/lib/blog";
import { blogUpdateSchema } from "@/lib/validations";
import { destroyCloudinaryAsset } from "@/lib/cloudinary";

/** Best-effort, non-blocking Cloudinary delete of a cover public id. */
function cleanupCover(publicId: unknown): void {
  if (typeof publicId !== "string" || !publicId) return;
  after(async () => {
    try {
      await destroyCloudinaryAsset(publicId, "image");
    } catch (error) {
      console.error("[blog] cover cleanup failed", error);
    }
  });
}

export const { GET, PATCH, DELETE } = itemHandlers(
  blogRepository,
  blogUpdateSchema,
  {
    // Reject updates that point at a non-existent category.
    validate: validateBlogCategoryRef,
    // Delete the cover asset when the post is deleted.
    afterDelete: (post) => cleanupCover(post.coverPublicId),
    // Delete the previous cover asset when an update replaces or removes it.
    afterUpdate: (updated, previous) => {
      const oldId = previous?.coverPublicId;
      if (
        typeof oldId === "string" &&
        oldId &&
        oldId !== updated.coverPublicId
      ) {
        cleanupCover(oldId);
      }
    },
  },
);
