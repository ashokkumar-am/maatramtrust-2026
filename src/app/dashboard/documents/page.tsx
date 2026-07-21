import connectMongoDB from "@/lib/mongoose";
import OrgDocument from "@/models/DocumentModel";
import { getDocumentTypeOptions } from "@/lib/documents";
import { requireAdminPage } from "@/lib/dashboard-auth";
import {
  DocumentManager,
  type AdminDocument,
} from "@/components/documents/document-manager";

export const metadata = {
  title: "Documents · Maatram Admin",
};

interface AdminDocDoc {
  _id: unknown;
  type: string;
  year: number;
  title?: string;
  fileName: string;
  size?: number;
  isActive: boolean;
}

export default async function AdminDocumentsPage() {
  await requireAdminPage("/dashboard/documents");

  await connectMongoDB();
  const docs = await OrgDocument.find()
    .sort({ year: -1, createdAt: -1 })
    .select("type year title fileName size isActive")
    .lean<AdminDocDoc[]>()
    .exec();

  const documents: AdminDocument[] = docs.map((doc) => ({
    id: String(doc._id),
    type: doc.type,
    year: doc.year,
    title: doc.title,
    fileName: doc.fileName,
    size: doc.size,
    isActive: doc.isActive,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload annual reports and tax documents. These appear on the public
          About page for download.
        </p>
      </header>

      <DocumentManager documents={documents} types={getDocumentTypeOptions()} />
    </div>
  );
}
