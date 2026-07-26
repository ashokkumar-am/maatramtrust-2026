import mongoose, { Schema } from "mongoose";
import { auditUserSchema } from "@/models/audit-schema";

export const SPONSORSHIP_STATUSES = ["pending", "received", "failed"] as const;

/**
 * A sponsorship / payment made toward a student, captured per year. Records the
 * donor's details against the student so contributions can be tracked
 * year-wise. Created as `pending` when a Razorpay order starts and flipped to
 * `received` by the webhook on capture; manual admin entries are `received`.
 */
const studentPaymentSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    // Denormalized for readable listings / emails without a join.
    studentName: {
      type: String,
      trim: true,
    },
    // Sponsorship year (e.g. 2026). Contributions are tracked per year.
    year: {
      type: Number,
      required: true,
      index: true,
    },

    // Donor details. `userId` links the sponsorship to the signed-in account
    // (Auth.js user id) so donors can see their own sponsored students.
    userId: {
      type: String,
      trim: true,
      index: true,
    },
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
    // Legacy display label (e.g. "2026-Ashok Kumar A M"), kept for compatibility.
    name: {
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
      enum: SPONSORSHIP_STATUSES,
      default: "pending",
      index: true,
    },

    // Payment references.
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

const StudentPayment =
  mongoose.models.StudentPayment ||
  mongoose.model("StudentPayment", studentPaymentSchema);

export default StudentPayment;
