import mongoose, { Schema } from "mongoose";
import { auditUserSchema } from "@/models/audit-schema";

export const GENDERS = ["Male", "Female", "Other"] as const;
export const STUDENT_TYPES = ["School", "College"] as const;
export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;
export const PARENTING_STATUSES = [
  "orphan",
  "single-parent",
  "single-father",
  "single-mother",
  "family",
  "guardian",
] as const;

const studentSchema = new Schema(
  {
    student_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
    },
    public_id: {
      type: String,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: GENDERS,
    },
    phonenumber: {
      type: String,
      trim: true,
    },
    reason: {
      type: String,
    },
    student_type: {
      type: String,
      enum: STUDENT_TYPES,
      required: true,
    },
    blood_group: {
      type: String,
      enum: BLOOD_GROUPS,
    },

    // School-specific
    school_name: {
      type: String,
    },
    grade_level: {
      type: String,
    },

    // College-specific
    college_name: {
      type: String,
    },
    department: {
      type: String,
    },
    semester: {
      type: String,
    },

    marks: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    originalAmount: {
      type: Number,
      min: 0,
    },
    parenting_status: {
      type: String,
      enum: PARENTING_STATUSES,
    },
    isStatus: {
      type: Boolean,
      default: false,
    },
    isDonate: {
      type: Boolean,
      default: false,
    },

    // Audit trail: who created and who last updated this record.
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

const Student =
  mongoose.models.Student || mongoose.model("Student", studentSchema);

export default Student;
