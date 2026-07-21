"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditDocumentButton } from "@/components/documents/edit-document-button";

export interface AdminDocument {
  id: string;
  type: string;
  year: number;
  title?: string;
  fileName: string;
  size?: number;
  isActive: boolean;
}

export interface DocumentTypeOption {
  value: string;
  label: string;
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}

export function DocumentManager({
  documents,
  types,
}: {
  documents: AdminDocument[];
  types: DocumentTypeOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState(types[0]?.value ?? "");
  const [year, setYear] = useState<number | "">(new Date().getFullYear());
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const typeLabel = (value: string) =>
    types.find((t) => t.value === value)?.label ?? value;

  function uploadDocument() {
    if (!file) {
      toast.error("Choose a file to upload.");
      return;
    }
    const yearValue = Number(year);
    if (!yearValue || yearValue < 2000 || yearValue > 2100) {
      toast.error("Enter a valid year.");
      return;
    }

    startTransition(async () => {
      // The server stores the file in Cloudinary and records the metadata.
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);
      form.append("year", String(yearValue));
      if (title.trim()) form.append("title", title.trim());

      const res = await fetch("/api/admin/documents/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message ?? "Could not upload the document.");
        return;
      }

      toast.success("Document uploaded.");
      setTitle("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    });
  }

  function removeDocument(doc: AdminDocument) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/documents/${doc.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Document deleted.");
        router.refresh();
      } else {
        toast.error("Could not delete the document.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-lg border p-4">
        <h2 className="mb-4 font-medium">Upload a document</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            >
              {types.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Year</span>
            <Input
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) =>
                setYear(e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Title (optional)</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Report 2025"
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium">File</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </label>
        </div>

        <Button
          type="button"
          onClick={uploadDocument}
          disabled={pending || !file}
          className="mt-4"
        >
          <Upload className="size-3" />
          {pending ? "Uploading…" : "Upload document"}
        </Button>
      </section>

      <section>
        <h2 className="mb-3 font-medium">Published documents</h2>
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No documents uploaded yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <FileText className="text-muted-foreground size-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {doc.title || `${typeLabel(doc.type)} ${doc.year}`}
                  </div>
                  <div className="text-muted-foreground truncate text-xs">
                    {typeLabel(doc.type)} · {doc.year} · {doc.fileName}
                    {doc.size ? ` · ${formatSize(doc.size)}` : ""}
                    {doc.isActive ? "" : " · hidden"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <EditDocumentButton
                    id={doc.id}
                    type={doc.type}
                    year={doc.year}
                    title={doc.title}
                    isActive={doc.isActive}
                    types={types}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDocument(doc)}
                    disabled={pending}
                  >
                    <Trash2 className="size-3" />
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
