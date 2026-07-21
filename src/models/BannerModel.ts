import mongoose, { Schema } from "mongoose";
import { auditUserSchema } from "@/models/audit-schema";

export const BANNER_MEDIA_TYPES = ["image", "video"] as const;

/**
 * Homepage banner. The media asset (image or video) lives in Cloudinary; we
 * store its `url` (secure URL) and `public_id`. `order` + `isActive` drive what
 * the public site shows and in what sequence.
 */
const bannerSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    mediaType: {
      type: String,
      enum: BANNER_MEDIA_TYPES,
      required: true,
    },
    // Cloudinary secure URL of the image/video.
    url: {
      type: String,
      required: true,
    },
    // Cloudinary public id (used to manage/transform the asset).
    public_id: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      trim: true,
    },
    caption: {
      type: String,
      trim: true,
    },
    // Optional click-through URL for the banner.
    link: {
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

const Banner = mongoose.models.Banner || mongoose.model("Banner", bannerSchema);

export default Banner;
