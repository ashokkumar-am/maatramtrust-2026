import { z } from "zod";
import {
  BLOOD_GROUPS,
  GENDERS,
  PARENTING_STATUSES,
  STUDENT_TYPES,
} from "@/models/StudentModel";
import { BANNER_MEDIA_TYPES } from "@/models/BannerModel";
import { DOCUMENT_TYPES } from "@/models/DocumentModel";
import { BLOG_STATUSES } from "@/models/BlogModel";
import { ANNADHANA_OCCASIONS } from "@/models/AnnadhanaBookingModel";
import { ANNADHANA_MEDIA_TYPES } from "@/models/AnnadhanaUpdateModel";

/**
 * Shared request-payload validation schemas for the v1 API.
 * Keeping these in one module lets routes stay thin and lets forms
 * reuse the exact same rules (single source of truth).
 */

const mobileRegex = /^[+]?[\d\s-]{7,15}$/;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email("A valid email is required"),
  mobile: z
    .string()
    .trim()
    .regex(mobileRegex, "A valid mobile number is required"),
  comments: z.string().trim().min(1, "Comments are required"),
  isSource: z.string().trim().min(1).optional(),
});

export const contactUpdateSchema = contactSchema.partial();

export const newsletterSchema = z.object({
  email: z.email("A valid email is required"),
  isSource: z.string().trim().min(1).optional(),
});

export const newsletterUpdateSchema = newsletterSchema.partial();

export const studentCreateSchema = z.object({
  student_id: z.string().trim().min(1, "Student ID is required"),
  name: z.string().trim().min(1, "Name is required"),
  photo: z.url("Photo must be a valid URL").optional(),
  public_id: z.string().trim().optional(),
  dob: z.coerce.date().optional(),
  gender: z.enum(GENDERS).optional(),
  phonenumber: z
    .string()
    .trim()
    .regex(mobileRegex, "A valid phone number is required")
    .optional(),
  reason: z.string().trim().optional(),
  student_type: z.enum(STUDENT_TYPES),
  blood_group: z.enum(BLOOD_GROUPS).optional(),
  school_name: z.string().trim().optional(),
  grade_level: z.string().trim().optional(),
  college_name: z.string().trim().optional(),
  department: z.string().trim().optional(),
  semester: z.string().trim().optional(),
  marks: z.string().trim().optional(),
  aadhaar_number: z
    .string()
    .trim()
    .regex(/^\d{12}$/, "Aadhaar must be 12 digits")
    .optional(),
  aadhaar_image: z.url("Aadhaar image must be a valid URL").optional(),
  pan_number: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}\d{4}[A-Z]$/, "PAN must look like ABCDE1234F")
    .optional(),
  pan_image: z.url("PAN image must be a valid URL").optional(),
  mark_statement_image: z
    .url("Mark statement image must be a valid URL")
    .optional(),
  amount: z.coerce.number().min(0, "Amount cannot be negative"),
  originalAmount: z.coerce.number().min(0).optional(),
  parenting_status: z.enum(PARENTING_STATUSES).optional(),
  isStatus: z.boolean().optional(),
  isDonate: z.boolean().optional(),
});

// Every field optional for partial updates; the identifier is passed
// separately. Optional fields also accept an explicit `null`, which clears the
// stored value (the repository translates null -> $unset); required fields
// (student_id, name, student_type, amount) can only be replaced, never cleared.
const partialStudent = studentCreateSchema.partial();
export const studentUpdateSchema = partialStudent.extend({
  photo: partialStudent.shape.photo.nullable(),
  public_id: partialStudent.shape.public_id.nullable(),
  dob: partialStudent.shape.dob.nullable(),
  gender: partialStudent.shape.gender.nullable(),
  phonenumber: partialStudent.shape.phonenumber.nullable(),
  reason: partialStudent.shape.reason.nullable(),
  blood_group: partialStudent.shape.blood_group.nullable(),
  school_name: partialStudent.shape.school_name.nullable(),
  grade_level: partialStudent.shape.grade_level.nullable(),
  college_name: partialStudent.shape.college_name.nullable(),
  department: partialStudent.shape.department.nullable(),
  semester: partialStudent.shape.semester.nullable(),
  marks: partialStudent.shape.marks.nullable(),
  aadhaar_number: partialStudent.shape.aadhaar_number.nullable(),
  aadhaar_image: partialStudent.shape.aadhaar_image.nullable(),
  pan_number: partialStudent.shape.pan_number.nullable(),
  pan_image: partialStudent.shape.pan_image.nullable(),
  mark_statement_image: partialStudent.shape.mark_statement_image.nullable(),
  originalAmount: partialStudent.shape.originalAmount.nullable(),
  parenting_status: partialStudent.shape.parenting_status.nullable(),
});

export const sponsorshipCreateSchema = z.object({
  donorName: z.string().trim().min(1).optional(),
  donorEmail: z.email("A valid donor email is required").optional(),
  donorPhone: z.string().trim().optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  currency: z.string().trim().min(1).optional(),
  note: z.string().trim().optional(),
});

export const sponsorshipOrderSchema = z.object({
  studentId: z.string().trim().min(1, "Student is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  donorName: z.string().trim().min(1).optional(),
  donorEmail: z.email("A valid donor email is required").optional(),
  donorPhone: z.string().trim().optional(),
});

export const donationOrderSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  donorName: z.string().trim().min(1).optional(),
  donorEmail: z.email("A valid email is required").optional(),
  anonymous: z.boolean().optional(),
  categoryId: z.string().trim().min(1).optional(),
});

export const donationConfirmSchema = z.object({
  orderId: z.string().trim().min(1, "orderId is required"),
  paymentId: z.string().trim().min(1, "paymentId is required"),
  signature: z.string().trim().min(1, "signature is required"),
});

// Admin-entered cash/offline donation.
export const manualDonationSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  donorName: z.string().trim().min(1).optional(),
  donorEmail: z.email("A valid email is required").optional(),
  anonymous: z.boolean().optional(),
  categoryId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "A valid category id is required")
    .optional(),
  method: z.enum(["cash", "cheque", "bank_transfer"]).optional(),
  note: z.string().trim().optional(),
  // Actual date the money was received (backdating offline donations).
  receivedAt: z.coerce.date().optional(),
});

// Void/refund a donation.
export const voidDonationSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

const documentYear = z.coerce.number().int().min(2000).max(2100);

// Metadata that accompanies a document file upload (multipart form fields).
export const documentUploadSchema = z.object({
  type: z.enum(DOCUMENT_TYPES),
  year: documentYear,
  title: z.string().trim().optional(),
});

// Full document record (Cloudinary-backed). Used by the generic create route.
export const documentCreateSchema = z.object({
  type: z.enum(DOCUMENT_TYPES),
  year: documentYear,
  title: z.string().trim().optional(),
  fileName: z.string().trim().min(1, "File name is required"),
  url: z.url("A valid URL is required"),
  publicId: z.string().trim().min(1, "publicId is required"),
  resourceType: z.string().trim().optional(),
  contentType: z.string().trim().optional(),
  size: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const documentUpdateSchema = documentCreateSchema.partial();

export const bannerCreateSchema = z.object({
  title: z.string().trim().optional(),
  mediaType: z.enum(BANNER_MEDIA_TYPES),
  url: z.url("A valid media URL is required"),
  public_id: z.string().trim().min(1, "Cloudinary public_id is required"),
  alt: z.string().trim().optional(),
  caption: z.string().trim().optional(),
  link: z.url("Link must be a valid URL").optional(),
  order: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

// Optional text fields accept an explicit `null` on update, which clears the
// stored value (the repository translates null -> $unset).
const partialBanner = bannerCreateSchema.partial();
export const bannerUpdateSchema = partialBanner.extend({
  title: partialBanner.shape.title.nullable(),
  alt: partialBanner.shape.alt.nullable(),
  caption: partialBanner.shape.caption.nullable(),
  link: partialBanner.shape.link.nullable(),
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// A 24-char hex Mongo ObjectId (validated without importing mongoose here, so
// this module stays safe to import from client components).
const objectIdString = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "A valid id is required");

const categoryBase = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
  // Parent category id — a sub-category has one; null clears it (top-level).
  parent: objectIdString.nullable().optional(),
  description: z.string().trim().optional(),
  // Cloudinary icon + image (nullable so an update can clear them).
  icon: z.url("Icon must be a valid URL").nullable().optional(),
  iconPublicId: z.string().trim().nullable().optional(),
  image: z.url("Image must be a valid URL").nullable().optional(),
  imagePublicId: z.string().trim().nullable().optional(),
  order: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

// Derive a slug from the name when one isn't supplied.
export const categoryCreateSchema = categoryBase.transform((data) => ({
  ...data,
  slug: data.slug ? slugify(data.slug) : slugify(data.name),
}));

export const categoryUpdateSchema = categoryBase
  .partial()
  .transform((data) =>
    data.slug ? { ...data, slug: slugify(data.slug) } : data,
  );

const blogBase = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z.string().trim().min(1).optional(),
  category: objectIdString,
  // Nullable: an explicit null clears the field on update (see repository).
  excerpt: z.string().trim().nullable().optional(),
  content: z.string().trim().min(1, "Content is required"),
  coverImage: z.url("Cover image must be a valid URL").nullable().optional(),
  coverPublicId: z.string().trim().nullable().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  status: z.enum(BLOG_STATUSES).optional(),
  publishedAt: z.coerce.date().optional(),
});

// Derive the slug from the title, and stamp publishedAt when created as
// published without an explicit date (WordPress-style publish behavior).
export const blogCreateSchema = blogBase.transform((data) => ({
  ...data,
  slug: data.slug ? slugify(data.slug) : slugify(data.title),
  publishedAt:
    data.status === "published" && !data.publishedAt
      ? new Date()
      : data.publishedAt,
}));

// Partial update; re-slug only when a slug (or title, if slug omitted) is given.
export const blogUpdateSchema = blogBase.partial().transform((data) => {
  if (data.slug) return { ...data, slug: slugify(data.slug) };
  return data;
});

const annadhanaCampaignBase = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  // Cloudinary image (nullable so an update can clear it).
  image: z.url("Image must be a valid URL").nullable().optional(),
  imagePublicId: z.string().trim().nullable().optional(),
  minAmount: z.coerce.number().min(0, "Minimum amount cannot be negative"),
  targetAmount: z.coerce.number().positive().nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  order: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

// Derive a slug from the title when one isn't supplied.
export const annadhanaCampaignCreateSchema = annadhanaCampaignBase.transform(
  (data) => ({
    ...data,
    slug: data.slug ? slugify(data.slug) : slugify(data.title),
  }),
);

export const annadhanaCampaignUpdateSchema = annadhanaCampaignBase
  .partial()
  .transform((data) =>
    data.slug ? { ...data, slug: slugify(data.slug) } : data,
  );

const annadhanaBookingBase = z.object({
  campaignId: objectIdString.optional(),
  occasion: z.enum(ANNADHANA_OCCASIONS),
  // Free-text label when the occasion is "other".
  occasionDetail: z.string().trim().optional(),
  honoreeName: z.string().trim().optional(),
  eventDate: z.coerce.date(),
  donorName: z.string().trim().min(1).optional(),
  donorEmail: z.email("A valid donor email is required").optional(),
  donorPhone: z
    .string()
    .trim()
    .regex(mobileRegex, "A valid phone number is required")
    .optional(),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  note: z.string().trim().optional(),
});

// Admin-entered (offline) booking; recorded as received immediately.
export const annadhanaBookingCreateSchema = annadhanaBookingBase.extend({
  currency: z.string().trim().min(1).optional(),
});

// Admin maintenance of a booking: fix details or cancel it. Payment fields
// (amount/receivedAmt/orderId/payId) are owned by the payment flow, and the
// only status transition allowed here is a cancellation.
export const annadhanaBookingUpdateSchema = annadhanaBookingBase
  .omit({ campaignId: true, amount: true })
  .extend({ status: z.literal("cancelled") })
  .partial();

// Public self-booking: starts a Razorpay order.
export const annadhanaBookingOrderSchema = annadhanaBookingBase;

/** Normalize a date to midnight UTC so day-wise uniqueness works. */
function toUtcDay(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}

const annadhanaUpdateMediaSchema = z.object({
  url: z.url("A valid media URL is required"),
  publicId: z.string().trim().optional(),
  mediaType: z.enum(ANNADHANA_MEDIA_TYPES).optional(),
});

const annadhanaUpdateBase = z.object({
  campaignId: objectIdString,
  date: z.coerce.date().transform(toUtcDay),
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  media: z.array(annadhanaUpdateMediaSchema).max(30).optional(),
  isActive: z.boolean().optional(),
});

// Day-wise campaign update (photos/videos). One per campaign per day.
export const annadhanaUpdateCreateSchema = annadhanaUpdateBase;

// Nullable title/description so an edit can clear them ($unset in the repo).
export const annadhanaUpdateUpdateSchema = annadhanaUpdateBase
  .omit({ campaignId: true })
  .extend({
    title: z.string().trim().nullable().optional(),
    description: z.string().trim().nullable().optional(),
  })
  .partial();

export type ContactInput = z.infer<typeof contactSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
export type SponsorshipCreateInput = z.infer<typeof sponsorshipCreateSchema>;
export type SponsorshipOrderInput = z.infer<typeof sponsorshipOrderSchema>;
export type DonationOrderInput = z.infer<typeof donationOrderSchema>;
export type DonationConfirmInput = z.infer<typeof donationConfirmSchema>;
export type ManualDonationInput = z.infer<typeof manualDonationSchema>;
export type VoidDonationInput = z.infer<typeof voidDonationSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
export type BannerCreateInput = z.infer<typeof bannerCreateSchema>;
export type BannerUpdateInput = z.infer<typeof bannerUpdateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type BlogCreateInput = z.infer<typeof blogCreateSchema>;
export type BlogUpdateInput = z.infer<typeof blogUpdateSchema>;
export type AnnadhanaCampaignCreateInput = z.infer<
  typeof annadhanaCampaignCreateSchema
>;
export type AnnadhanaCampaignUpdateInput = z.infer<
  typeof annadhanaCampaignUpdateSchema
>;
export type AnnadhanaBookingCreateInput = z.infer<
  typeof annadhanaBookingCreateSchema
>;
export type AnnadhanaBookingUpdateInput = z.infer<
  typeof annadhanaBookingUpdateSchema
>;
export type AnnadhanaBookingOrderInput = z.infer<
  typeof annadhanaBookingOrderSchema
>;
export type AnnadhanaUpdateCreateInput = z.infer<
  typeof annadhanaUpdateCreateSchema
>;
export type AnnadhanaUpdateUpdateInput = z.infer<
  typeof annadhanaUpdateUpdateSchema
>;
