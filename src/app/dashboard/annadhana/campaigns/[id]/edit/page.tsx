import { notFound } from "next/navigation";
import mongoose from "mongoose";
import connectMongoDB from "@/lib/mongoose";
import AnnadhanaCampaign from "@/models/AnnadhanaCampaignModel";
import { requireAdminPage } from "@/lib/dashboard-auth";
import {
  AnnadhanaCampaignForm,
  type AnnadhanaCampaignValues,
} from "@/components/dashboard/annadhana-campaign-form";

export const metadata = { title: "Edit Annadhana campaign · Maatram Admin" };

interface CampaignDoc {
  _id: unknown;
  title: string;
  slug?: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  minAmount?: number;
  targetAmount?: number;
  startDate?: Date;
  endDate?: Date;
  order?: number;
  isActive?: boolean;
}

/** Date → the `yyyy-MM-dd` string an `<input type="date">` expects. */
const toDateInput = (value?: Date) =>
  value ? value.toISOString().slice(0, 10) : undefined;

export default async function EditAnnadhanaCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdminPage(`/dashboard/annadhana/campaigns/${id}/edit`);

  if (!mongoose.isValidObjectId(id)) notFound();
  await connectMongoDB();
  const doc = await AnnadhanaCampaign.findById(id).lean<CampaignDoc>().exec();
  if (!doc) notFound();

  const initial: AnnadhanaCampaignValues = {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    image: doc.image,
    imagePublicId: doc.imagePublicId,
    minAmount: doc.minAmount,
    targetAmount: doc.targetAmount,
    startDate: toDateInput(doc.startDate),
    endDate: toDateInput(doc.endDate),
    order: doc.order,
    isActive: doc.isActive,
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit Annadhana campaign
        </h1>
      </header>
      <AnnadhanaCampaignForm initial={initial} />
    </div>
  );
}
