import mongoose, { Schema } from "mongoose";
import { auditUserSchema } from "@/models/audit-schema";

export const BLOG_STATUSES = ["draft", "published"] as const;

/**
 * A blog post, organized by category (WordPress-style). The body lives in
 * `content`; `status` gates public visibility (drafts are admin-only). `slug`
 * is a URL-safe unique key derived from the title.
 */
const blogSchema = new Schema(
  {
    title: {
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
    // Category this post belongs to (Category model, ideally with type "blog").
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    excerpt: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    // Cloudinary public id for the cover, so the asset can be cleaned up.
    coverPublicId: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: BLOG_STATUSES,
      default: "draft",
      index: true,
    },
    publishedAt: {
      type: Date,
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

// Newest published posts within a category.
blogSchema.index({ status: 1, publishedAt: -1 });

/**
 * Stamp `publishedAt` the first time a post transitions to "published" via an
 * update, unless an explicit date is supplied. Keeps a post's original publish
 * date stable on later edits, and makes publishing correct for any API caller
 * (not just the dashboard form). Create-time stamping lives in the zod schema.
 */
blogSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as
    (Record<string, unknown> & { $set?: Record<string, unknown> }) | null;
  if (!update) return;

  const set = (update.$set ?? update) as Record<string, unknown>;
  if (set.status !== "published" || set.publishedAt) return;

  const current = await this.model
    .findOne(this.getQuery())
    .select("publishedAt")
    .lean<{ publishedAt?: Date } | null>()
    .exec();

  if (!current?.publishedAt) {
    set.publishedAt = new Date();
    if (!update.$set) this.setUpdate(set);
  }
});

const BlogPost =
  mongoose.models.BlogPost || mongoose.model("BlogPost", blogSchema);

export default BlogPost;
