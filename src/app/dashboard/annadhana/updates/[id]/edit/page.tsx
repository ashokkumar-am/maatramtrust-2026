import { notFound } from "next/navigation";
import mongoose from "mongoose";
import connectMongoDB from "@/lib/mongoose";
import AnnadhanaUpdate from "@/models/AnnadhanaUpdateModel";
import { requireAdminPage } from "@/lib/dashboard-auth";
import {
  AnnadhanaUpdateForm,
  type AnnadhanaUpdateValues,
} from "@/components/dashboard/annadhana-update-form";
import type { GalleryMedia } from "@/components/dashboard/media-gallery-field";

export const metadata = { title: "Edit daily update · Maatram Admin" };

interface UpdateDoc {
  _id: unknown;
  campaignId: unknown;
  campaignTitle?: string;
  date: Date;
  title?: string;
  description?: string;
  media?: GalleryMedia[];
  isActive?: boolean;
}

export default async function EditAnnadhanaUpdatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdminPage(`/dashboard/annadhana/updates/${id}/edit`);

  if (!mongoose.isValidObjectId(id)) notFound();
  await connectMongoDB();
  const doc = await AnnadhanaUpdate.findById(id).lean<UpdateDoc>().exec();
  if (!doc) notFound();

  const initial: AnnadhanaUpdateValues = {
    id: String(doc._id),
    campaignId: String(doc.campaignId),
    date: new Date(doc.date).toISOString().slice(0, 10),
    title: doc.title,
    description: doc.description,
    media: (doc.media ?? []).map((m) => ({
      url: m.url,
      publicId: m.publicId,
      mediaType: m.mediaType ?? "image",
    })),
    isActive: doc.isActive,
  };

  // The campaign can't change after posting; show its title in the picker.
  const campaigns = [
    { id: initial.campaignId, title: doc.campaignTitle ?? "Campaign" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit daily update
        </h1>
      </header>
      <AnnadhanaUpdateForm initial={initial} campaigns={campaigns} />
    </div>
  );
}
