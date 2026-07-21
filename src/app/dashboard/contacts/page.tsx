import connectMongoDB from "@/lib/mongoose";
import Contact from "@/models/ContactModel";
import { requireAdminPage } from "@/lib/dashboard-auth";
import {
  ContactsList,
  type ContactRow,
} from "@/components/dashboard/contacts-list";

const PAGE_SIZE = 20;

interface Doc {
  _id: unknown;
  name: string;
  email: string;
  mobile: string;
  comments: string;
  createdAt?: Date;
}

export const metadata = { title: "Contacts · Maatram Admin" };

export default async function AdminContactsPage() {
  await requireAdminPage("/dashboard/contacts");
  await connectMongoDB();

  const [docs, total] = await Promise.all([
    Contact.find()
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE)
      .select("name email mobile comments createdAt")
      .lean<Doc[]>()
      .exec(),
    Contact.estimatedDocumentCount(),
  ]);

  const initialItems: ContactRow[] = docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    email: d.email,
    mobile: d.mobile,
    comments: d.comments,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
  }));

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {total} submissions.
        </p>
      </header>

      <ContactsList initialItems={initialItems} pageSize={PAGE_SIZE} />
    </div>
  );
}
