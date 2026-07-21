import Contact from "@/models/ContactModel";
import Newsletter from "@/models/NewsletterModel";
import Student from "@/models/StudentModel";
import Banner from "@/models/BannerModel";
import Category from "@/models/CategoryModel";
import OrgDocument from "@/models/DocumentModel";
import BlogPost from "@/models/BlogModel";
import AnnadhanaCampaign from "@/models/AnnadhanaCampaignModel";
import AnnadhanaBooking from "@/models/AnnadhanaBookingModel";
import AnnadhanaUpdate from "@/models/AnnadhanaUpdateModel";
import { createMongoRepository } from "@/lib/repository";

/**
 * Configured repositories, one per resource. Shared so every consumer
 * (admin API routes, Server Actions) uses the same data-access instance and
 * audit configuration.
 */
export const contactRepository = createMongoRepository(Contact, {
  searchFields: ["name", "email", "mobile"],
});
export const newsletterRepository = createMongoRepository(Newsletter, {
  searchFields: ["email"],
});
export const studentRepository = createMongoRepository(Student, {
  audit: true,
  searchFields: ["name", "student_id"],
});
export const bannerRepository = createMongoRepository(Banner, {
  audit: true,
  searchFields: ["title"],
});
export const categoryRepository = createMongoRepository(Category, {
  audit: true,
  searchFields: ["name", "slug"],
});
export const documentRepository = createMongoRepository(OrgDocument, {
  audit: true,
  searchFields: ["title", "fileName"],
});
export const blogRepository = createMongoRepository(BlogPost, {
  audit: true,
  searchFields: ["title", "excerpt"],
});
export const annadhanaCampaignRepository = createMongoRepository(
  AnnadhanaCampaign,
  {
    audit: true,
    searchFields: ["title", "slug"],
  },
);
// Item reads/updates/deletes only — the collection list/create live in
// `src/lib/annadhana.ts` (filtered history + payment-aware create).
export const annadhanaBookingRepository = createMongoRepository(
  AnnadhanaBooking,
  {
    audit: true,
    searchFields: ["donorName", "donorEmail", "honoreeName"],
  },
);
export const annadhanaUpdateRepository = createMongoRepository(
  AnnadhanaUpdate,
  {
    audit: true,
    searchFields: ["title", "campaignTitle"],
  },
);
