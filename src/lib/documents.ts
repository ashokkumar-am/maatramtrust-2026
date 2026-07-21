import "server-only";
import mongoose from "mongoose";
import connectMongoDB from "@/lib/mongoose";
import OrgDocument, { DOCUMENT_TYPES } from "@/models/DocumentModel";

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** Public, serializable document metadata (no S3 key exposed). */
export interface PublicDocument {
  id: string;
  type: DocumentType;
  year: number;
  title?: string;
  fileName: string;
  size?: number;
}

/** Documents of one type, newest year first. */
export interface DocumentGroup {
  type: DocumentType;
  label: string;
  documents: PublicDocument[];
}

const TYPE_LABELS: Record<DocumentType, string> = {
  "annual-report": "Annual Reports",
  itr: "Income Tax Returns",
};

/** Type options ({value,label}) for admin forms — single source with the enum. */
export function getDocumentTypeOptions(): {
  value: DocumentType;
  label: string;
}[] {
  return DOCUMENT_TYPES.map((type) => ({
    value: type,
    label: TYPE_LABELS[type],
  }));
}

interface DocumentDoc {
  _id: unknown;
  type: DocumentType;
  year: number;
  title?: string;
  fileName: string;
  size?: number;
}

function toPublic(doc: DocumentDoc): PublicDocument {
  return {
    id: String(doc._id),
    type: doc.type,
    year: doc.year,
    title: doc.title,
    fileName: doc.fileName,
    size: doc.size,
  };
}

/** Active documents, newest year first (flat list). */
export async function getPublicDocuments(): Promise<PublicDocument[]> {
  await connectMongoDB();
  const docs = await OrgDocument.find({ isActive: true })
    .sort({ year: -1, createdAt: -1 })
    .select("type year title fileName size")
    .lean<DocumentDoc[]>()
    .exec();
  return docs.map(toPublic);
}

/**
 * Active documents grouped by type (in the declared type order), each group's
 * documents newest-year first. Empty groups are omitted.
 */
export async function getPublicDocumentGroups(): Promise<DocumentGroup[]> {
  const documents = await getPublicDocuments();

  return DOCUMENT_TYPES.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    documents: documents.filter((doc) => doc.type === type),
  })).filter((group) => group.documents.length > 0);
}

/**
 * Resolve an active document's Cloudinary URL + filename for download, or `null`
 * when the id is unknown/invalid/inactive.
 */
export async function getDownloadTarget(
  id: string,
): Promise<{ url: string; fileName: string } | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectMongoDB();
  const doc = await OrgDocument.findOne({ _id: id, isActive: true })
    .select("url fileName")
    .lean<{ url: string; fileName: string }>()
    .exec();
  return doc ? { url: doc.url, fileName: doc.fileName } : null;
}
