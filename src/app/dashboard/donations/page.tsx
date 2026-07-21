import connectMongoDB from "@/lib/mongoose";
import Category from "@/models/CategoryModel";
import { getAdminDonations } from "@/lib/donations";
import { requireAdminPage } from "@/lib/dashboard-auth";
import { CashDonationButton } from "@/components/dashboard/cash-donation-button";
import {
  DonationsList,
  type DonationRow,
} from "@/components/dashboard/donations-list";

export const metadata = { title: "Donations · Maatram Admin" };

const PAGE_SIZE = 20;

interface CategoryDoc {
  _id: unknown;
  name: string;
}

export default async function AdminDonationsPage() {
  await requireAdminPage("/dashboard/donations");
  await connectMongoDB();

  const [donations, cats] = await Promise.all([
    getAdminDonations({ limit: PAGE_SIZE }),
    Category.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .select("name")
      .lean<CategoryDoc[]>()
      .exec(),
  ]);

  const categories = cats.map((c) => ({ id: String(c._id), name: c.name }));

  // `at` is a Date from the lib — serialize for the client component.
  const initialItems: DonationRow[] = donations.map((d) => ({
    ...d,
    at: new Date(d.at).toISOString(),
  }));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Donations</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Online and cash donations.
          </p>
        </div>
        <CashDonationButton categories={categories} />
      </header>

      <DonationsList initialItems={initialItems} pageSize={PAGE_SIZE} />
    </div>
  );
}
