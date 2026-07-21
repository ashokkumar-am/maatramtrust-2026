import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import connectMongoDB from "@/lib/mongoose";
import AnnadhanaCampaign from "@/models/AnnadhanaCampaignModel";
import { listAnnadhanaUpdates } from "@/lib/annadhana";
import { requireAdminPage } from "@/lib/dashboard-auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AnnadhanaUpdatesList,
  type UpdateRow,
} from "@/components/dashboard/annadhana-updates-list";

export const metadata = { title: "Annadhana daily updates · Maatram Admin" };

const PAGE_SIZE = 20;

interface CampaignDoc {
  _id: unknown;
  title: string;
}

interface UpdateDoc {
  _id: unknown;
  campaignTitle?: string;
  date: Date;
  title?: string;
  media?: unknown[];
  isActive?: boolean;
}

export default async function AdminAnnadhanaUpdatesPage() {
  await requireAdminPage("/dashboard/annadhana/updates");
  await connectMongoDB();

  const [updates, campaignDocs] = await Promise.all([
    listAnnadhanaUpdates(new URLSearchParams({ limit: String(PAGE_SIZE) })),
    AnnadhanaCampaign.find()
      .sort({ order: 1, title: 1 })
      .select("title")
      .lean<CampaignDoc[]>()
      .exec(),
  ]);

  const campaigns = campaignDocs.map((c) => ({
    id: String(c._id),
    title: c.title,
  }));

  const initialItems: UpdateRow[] = (
    updates.items as unknown as UpdateDoc[]
  ).map((u) => ({
    id: String(u._id),
    campaignTitle: u.campaignTitle,
    date: new Date(u.date).toISOString(),
    title: u.title,
    mediaCount: u.media?.length ?? 0,
    isActive: u.isActive,
  }));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Daily updates
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Day-wise photos and videos shown on the public campaign feed,
            alongside each day&apos;s breakfast sponsor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/annadhana"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ArrowLeft className="size-3" />
            Bookings
          </Link>
          <Link
            href="/dashboard/annadhana/updates/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Plus className="size-3" />
            Post a day
          </Link>
        </div>
      </header>

      <AnnadhanaUpdatesList
        initialItems={initialItems}
        campaigns={campaigns}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
