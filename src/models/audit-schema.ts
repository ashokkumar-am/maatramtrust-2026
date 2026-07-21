import { Schema } from "mongoose";

/**
 * Audit sub-document capturing which authenticated user performed an action.
 * Denormalizes email/name so the audit trail is readable without a join, while
 * keeping the adapter user's ObjectId for reference. Shared across models that
 * record `createdBy` / `updatedBy` (single source of truth).
 */
export const auditUserSchema = new Schema(
  {
    id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    email: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);
