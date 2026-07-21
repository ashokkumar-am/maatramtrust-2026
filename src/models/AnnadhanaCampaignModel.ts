import mongoose, { Schema } from "mongoose";
import { auditUserSchema } from "@/models/audit-schema";

/**
 * An Annadhana Sevai campaign — a drive (e.g. "Annadhana Sevai 2026") that
 * donors can book meal sponsorships against, either themselves on the public
 * site or via an admin-entered booking. `isActive` + the optional date window
 * control whether the public site accepts self-bookings for it.
 */
const annadhanaCampaignSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // URL-safe key, derived from the title when not supplied.
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Cloudinary image shown on the campaign card.
    image: {
      type: String,
      trim: true,
    },
    imagePublicId: {
      type: String,
      trim: true,
    },
    // Minimum booking amount in major currency units (rupees).
    minAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Optional fundraising goal in major currency units.
    targetAmount: {
      type: Number,
      min: 0,
    },
    // Optional window during which the campaign accepts bookings.
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
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

const AnnadhanaCampaign =
  mongoose.models.AnnadhanaCampaign ||
  mongoose.model("AnnadhanaCampaign", annadhanaCampaignSchema);

export default AnnadhanaCampaign;
