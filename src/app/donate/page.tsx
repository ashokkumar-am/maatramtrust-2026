import { auth } from "@/auth";
import connectMongoDB from "@/lib/mongoose";
import Category from "@/models/CategoryModel";
import { getPublicDonations } from "@/lib/donations";
import { DonateForm } from "@/components/donate/donate-form";
import { RecentDonations } from "@/components/home/recent-donations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Donate · Maatram",
  description: "Support a student's education with a secure online donation.",
};

interface CategoryDoc {
  _id: unknown;
  name: string;
}

export default async function DonatePage() {
  await connectMongoDB();

  const [session, categoryDocs, donations] = await Promise.all([
    auth(),
    Category.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .select("name")
      .lean<CategoryDoc[]>()
      .exec(),
    getPublicDonations(),
  ]);

  const categories = categoryDocs.map((category) => ({
    id: String(category._id),
    name: category.name,
  }));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          Support a student
        </h1>
        <p className="text-muted-foreground mt-2">
          Every contribution helps a student stay in education. Donations are
          processed securely, and an 80G-ready receipt is emailed to you.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Make a donation</CardTitle>
            <CardDescription>
              Choose an amount and enter your details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DonateForm
              categories={categories}
              defaultName={session?.user?.name ?? ""}
              defaultEmail={session?.user?.email ?? ""}
            />
          </CardContent>
        </Card>

        <div>
          <RecentDonations donations={donations} />
          {donations.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Be the first to support a student today.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
