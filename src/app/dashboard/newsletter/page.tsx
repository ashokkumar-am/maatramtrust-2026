import connectMongoDB from "@/lib/mongoose";
import Newsletter from "@/models/NewsletterModel";
import { requireAdminPage } from "@/lib/dashboard-auth";
import {
  NewsletterList,
  type SubscriberRow,
} from "@/components/dashboard/newsletter-list";
import { NewsletterDialog } from "@/components/dashboard/newsletter-dialog";

const PAGE_SIZE = 20;

interface Doc {
  _id: unknown;
  email: string;
  isSource?: string;
  createdAt?: Date;
}

export const metadata = { title: "Newsletter · Maatram Admin" };

export default async function AdminNewsletterPage() {
  await requireAdminPage("/dashboard/newsletter");
  await connectMongoDB();

  const [docs, total] = await Promise.all([
    Newsletter.find()
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE)
      .select("email isSource createdAt")
      .lean<Doc[]>()
      .exec(),
    Newsletter.estimatedDocumentCount(),
  ]);

  const initialItems: SubscriberRow[] = docs.map((d) => ({
    id: String(d._id),
    email: d.email,
    isSource: d.isSource,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
  }));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Newsletter</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {total} subscribers.
          </p>
        </div>
        <NewsletterDialog />
      </header>

      <NewsletterList initialItems={initialItems} pageSize={PAGE_SIZE} />
    </div>
  );
}
