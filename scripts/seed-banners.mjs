/**
 * Seed sample homepage banners into MongoDB (collection: `banners`).
 *
 * Idempotent: upserts by `title`, so re-running updates rather than duplicates.
 * Media URLs point at Cloudinary's public demo assets as placeholders — replace
 * the `url`/`public_id` with your own `maatramtrust2026` uploads when ready.
 *
 * Run:  node --env-file=.env.local scripts/seed-banners.mjs
 */
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Run with --env-file=.env.local");
  process.exit(1);
}

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    mediaType: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    alt: { type: String, trim: true },
    caption: { type: String, trim: true },
    link: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Banner = mongoose.models.Banner || mongoose.model("Banner", bannerSchema);

const banners = [
  {
    title: "Empower a Student",
    mediaType: "image",
    url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    public_id: "sample",
    alt: "Students learning together",
    caption: "Your support keeps a child in school.",
    link: "/donate",
    order: 1,
    isActive: true,
  },
  {
    title: "Education Drive 2026",
    mediaType: "image",
    url: "https://res.cloudinary.com/demo/image/upload/balloons.jpg",
    public_id: "balloons",
    alt: "Celebrating the new academic year",
    caption: "Sponsor books, uniforms and fees.",
    link: "/students",
    order: 2,
    isActive: true,
  },
  {
    title: "Impact Story",
    mediaType: "video",
    url: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
    public_id: "dog",
    alt: "A short film on our impact",
    caption: "See the difference your gift makes.",
    link: "/about",
    order: 3,
    isActive: true,
  },
];

async function main() {
  await mongoose.connect(uri);
  for (const banner of banners) {
    await Banner.updateOne(
      { title: banner.title },
      { $set: banner },
      { upsert: true },
    );
    console.log(`upserted: ${banner.title} (${banner.mediaType})`);
  }
  const total = await Banner.countDocuments();
  console.log(`done — ${banners.length} seeded, ${total} banners total`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("seed failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
