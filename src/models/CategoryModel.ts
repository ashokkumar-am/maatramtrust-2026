import mongoose, { Schema } from "mongoose";
import { auditUserSchema } from "@/models/audit-schema";

/**
 * Generic, reusable category with self-referencing sub-categories. `slug` is a
 * URL-safe unique key; `type` optionally namespaces categories for a feature
 * (e.g. "blog", "gallery"). A `parent` makes the document a sub-category. Both
 * top-level and sub-categories carry a Cloudinary `icon` and `image` (each
 * stored as a secure URL plus its public id for cleanup).
 */
const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // Optional namespace so categories can be scoped per feature.
    type: {
      type: String,
      trim: true,
      index: true,
    },
    // Parent category — null/absent means this is a top-level category.
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Cloudinary icon (small glyph/thumbnail).
    icon: {
      type: String,
      trim: true,
    },
    iconPublicId: {
      type: String,
      trim: true,
    },
    // Cloudinary image (larger banner/cover for the category).
    image: {
      type: String,
      trim: true,
    },
    imagePublicId: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: auditUserSchema,
    },
    updatedBy: {
      type: auditUserSchema,
    },
  },
  {
    timestamps: true,
  },
);

const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);

export default Category;
