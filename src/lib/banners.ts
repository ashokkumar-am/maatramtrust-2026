import connectMongoDB from "@/lib/mongoose";
import Banner from "@/models/BannerModel";

/** Public, serializable shape of a banner (safe to pass to Client Components). */
export interface BannerView {
  id: string;
  title?: string;
  mediaType: "image" | "video";
  url: string;
  alt?: string;
  caption?: string;
  link?: string;
  order: number;
}

interface BannerDoc {
  _id: unknown;
  title?: string;
  mediaType: "image" | "video";
  url: string;
  alt?: string;
  caption?: string;
  link?: string;
  order?: number;
}

/**
 * Active homepage banners, ordered by `order` then newest. Shared by the public
 * API route and the home page so both read the same data the same way.
 */
export async function getActiveBanners(): Promise<BannerView[]> {
  await connectMongoDB();

  const docs = await Banner.find({ isActive: true })
    .sort({ order: 1, createdAt: -1 })
    .select("title mediaType url alt caption link order")
    .lean<BannerDoc[]>()
    .exec();

  return docs.map((doc) => ({
    id: String(doc._id),
    title: doc.title,
    mediaType: doc.mediaType,
    url: doc.url,
    alt: doc.alt,
    caption: doc.caption,
    link: doc.link,
    order: doc.order ?? 0,
  }));
}
