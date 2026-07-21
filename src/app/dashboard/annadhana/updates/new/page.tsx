import connectMongoDB from "@/lib/mongoose";
import AnnadhanaCampaign from "@/models/AnnadhanaCampaignModel";
import { requireAdminPage } from "@/lib/dashboard-auth";
import { AnnadhanaUpdateForm } from "@/components/dashboard/annadhana-update-form";

export const metadata = { title: "Post a day · Maatram Admin" };

interface CampaignDoc {
  _id: unknown;
  title: string;
}

export default async function NewAnnadhanaUpdatePage() {
  await requireAdminPage("/dashboard/annadhana/updates/new");
  await connectMongoDB();

  const campaignDocs = await AnnadhanaCampaign.find()
    .sort({ order: 1, title: 1 })
    .select("title")
    .lean<CampaignDoc[]>()
    .exec();

  const campaigns = campaignDocs.map((c) => ({
    id: String(c._id),
    title: c.title,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Post a day&apos;s update
        </h1>
      </header>
      <AnnadhanaUpdateForm campaigns={campaigns} />
    </div>
  );
}
