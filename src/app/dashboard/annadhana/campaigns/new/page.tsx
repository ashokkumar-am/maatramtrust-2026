import { requireAdminPage } from "@/lib/dashboard-auth";
import { AnnadhanaCampaignForm } from "@/components/dashboard/annadhana-campaign-form";

export const metadata = { title: "New Annadhana campaign · Maatram Admin" };

export default async function NewAnnadhanaCampaignPage() {
  await requireAdminPage("/dashboard/annadhana/campaigns/new");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          New Annadhana campaign
        </h1>
      </header>
      <AnnadhanaCampaignForm />
    </div>
  );
}
