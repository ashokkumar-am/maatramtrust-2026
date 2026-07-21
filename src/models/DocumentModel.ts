import mongoose, { Schema } from "mongoose";
import { auditUserSchema } from "@/models/audit-schema";

export const DOCUMENT_TYPES = ["annual-report", "itr"] as const;

/**
 * A downloadable org document (annual report, ITR, etc.) stored in Cloudinary
 * and published year-wise. The binary lives in Cloudinary (`publicId`); this
 * record holds the delivery `url` plus metadata.
 */
const documentSchema = new Schema(
  {
    type: {
      type: String,
      enum: DOCUMENT_TYPES,
      required: true,
      index: true,
    },
    // Reporting/financial year (e.g. 2025).
    year: {
      type: Number,
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    // Original filename, preserved for a friendly download name.
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    // Cloudinary delivery URL (secure_url).
    url: {
      type: String,
      required: true,
      trim: true,
    },
    // Cloudinary public id (unique — object storage is the source of truth).
    publicId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Cloudinary resource type (raw for docs, image for PDFs/images).
    resourceType: {
      type: String,
      default: "raw",
      trim: true,
    },
    contentType: {
      type: String,
      trim: true,
    },
    size: {
      type: Number,
      min: 0,
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

// Newest-first listings within a type.
documentSchema.index({ type: 1, year: -1 });

// Model named `OrgDocument` to avoid shadowing the global `Document` type.
const OrgDocument =
  mongoose.models.OrgDocument || mongoose.model("OrgDocument", documentSchema);

export default OrgDocument;
