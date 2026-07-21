import mongoose, { Schema } from "mongoose";
import { auditUserSchema } from "@/models/audit-schema";

export const ANNADHANA_MEDIA_TYPES = ["image", "video"] as const;

/** One photo/video in a daily update's gallery (Cloudinary-hosted). */
const updateMediaSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
    },
    mediaType: {
      type: String,
      enum: ANNADHANA_MEDIA_TYPES,
      default: "image",
    },
  },
  { _id: false },
);

/**
 * A day-wise update posted during an Annadhana Sevai campaign — the pictures
 * and videos from that day's breakfast, shown on the public campaign feed
 * alongside the day's sponsor(s) (derived from received bookings for the
 * date, never stored here). One update per campaign per day.
 */
const annadhanaUpdateSchema = new Schema(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "AnnadhanaCampaign",
      required: true,
      index: true,
    },
    // Denormalized for readable listings without a join.
    campaignTitle: {
      type: String,
      trim: true,
    },
    // The day this update covers (normalized to midnight UTC by the API).
    date: {
      type: Date,
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    media: {
      type: [updateMediaSchema],
      default: [],
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

// One update per campaign per day.
annadhanaUpdateSchema.index({ campaignId: 1, date: 1 }, { unique: true });

const AnnadhanaUpdate =
  mongoose.models.AnnadhanaUpdate ||
  mongoose.model("AnnadhanaUpdate", annadhanaUpdateSchema);

export default AnnadhanaUpdate;
