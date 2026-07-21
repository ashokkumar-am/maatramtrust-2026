import { after } from "next/server";
import { itemHandlers } from "@/lib/crud-route";
import { categoryRepository } from "@/lib/resources";
import { categoryUpdateSchema } from "@/lib/validations";
import { validateCategoryParent } from "@/lib/categories";
import { destroyCloudinaryAsset } from "@/lib/cloudinary";
import connectMongoDB from "@/lib/mongoose";
import BlogPost from "@/models/BlogModel";
import Category from "@/models/CategoryModel";

/** Best-effort, non-blocking Cloudinary delete of a category image asset. */
function cleanupImage(publicId: unknown): void {
  if (typeof publicId !== "string" || !publicId) return;
  after(async () => {
    try {
      await destroyCloudinaryAsset(publicId, "image");
    } catch (error) {
      console.error("[categories] cloudinary cleanup failed", error);
    }
  });
}

export const { GET, PATCH, DELETE } = itemHandlers(
  categoryRepository,
  categoryUpdateSchema,
  {
    // Reject updates that point `parent` at a non-existent category.
    validate: validateCategoryParent,

    // Don't orphan content: block deleting a category that still has blog posts
    // or sub-categories.
    beforeDelete: async (id) => {
      await connectMongoDB();
      const [hasPosts, hasChildren] = await Promise.all([
        BlogPost.exists({ category: id }),
        Category.exists({ parent: id }),
      ]);
      if (hasPosts) {
        return "This category has blog posts. Reassign or delete them first.";
      }
      if (hasChildren) {
        return "This category has sub-categories. Remove them first.";
      }
      return null;
    },

    // Remove the icon + image assets when the category is deleted.
    afterDelete: (cat) => {
      cleanupImage(cat.iconPublicId);
      cleanupImage(cat.imagePublicId);
    },

    // Remove a previous asset when an update replaces or clears it.
    afterUpdate: (updated, previous) => {
      const oldIcon = previous?.iconPublicId;
      if (
        typeof oldIcon === "string" &&
        oldIcon &&
        oldIcon !== updated.iconPublicId
      ) {
        cleanupImage(oldIcon);
      }
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
