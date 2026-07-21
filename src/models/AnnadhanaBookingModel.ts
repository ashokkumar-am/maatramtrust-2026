import mongoose, { Schema } from "mongoose";
import { auditUserSchema } from "@/models/audit-schema";

export const ANNADHANA_OCCASIONS = [
  "birthday",
  "anniversary",
  "memorial",
  "other",
] as const;

export const ANNADHANA_BOOKING_STATUSES = [
  "pending",
  "received",
  "failed",
  "cancelled",
] as const;

export const ANNADHANA_BOOKING_SOURCES = ["online", "manual"] as const;

/**
 * An Annadhana Sevai booking — a donor sponsors meals for an occasion
 * (birthday, anniversary, in memory of a loved one, or another celebration)
 * on a chosen date. Created `pending` when a Razorpay order starts (online
 * self-booking) and flipped to `received` on capture; admin-entered bookings
 * are `received` immediately. Optionally tied to a campaign.
 */
const annadhanaBookingSchema = new Schema(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "AnnadhanaCampaign",
      index: true,
    },
    // Denormalized for readable listings / emails without a join.
    campaignTitle: {
      type: String,
      trim: true,
    },

    occasion: {
      type: String,
      enum: ANNADHANA_OCCASIONS,
      required: true,
      index: true,
    },
    // Free-text label when occasion is "other" (e.g. "housewarming").
    occasionDetail: {
      type: String,
      trim: true,
    },
    // Person celebrated or remembered (e.g. the birthday celebrant, or the
    // loved one the annadhanam is offered in memory of).
    honoreeName: {
      type: String,
      trim: true,
    },
    // The date the annadhanam is booked for.
    eventDate: {
      type: Date,
      required: true,
      index: true,
    },

    // Donor details.
    donorName: {
      type: String,
      trim: true,
    },
    donorEmail: {
      type: String,
      trim: true,
    },
    donorPhone: {
      type: String,
      trim: true,
    },

    // Pledged amount (major currency units) and amount actually received.
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    receivedAmt: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ANNADHANA_BOOKING_STATUSES,
      default: "pending",
      index: true,
    },
    // How the booking was made: donor self-booking vs admin entry.
    source: {
      type: String,
      enum: ANNADHANA_BOOKING_SOURCES,
      default: "online",
    },

    // Payment references (online bookings).
    orderId: {
      type: String,
      trim: true,
      index: true,
    },
    payId: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
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

const AnnadhanaBooking =
  mongoose.models.AnnadhanaBooking ||
  mongoose.model("AnnadhanaBooking", annadhanaBookingSchema);

export default AnnadhanaBooking;
