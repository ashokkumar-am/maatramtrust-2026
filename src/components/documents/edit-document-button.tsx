"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TypeOption {
  value: string;
  label: string;
}

/**
 * Edit a document's metadata (type, year, title, visibility) via
 * `PATCH /api/admin/documents/:id`. Replacing the file is done by deleting and
 * re-uploading.
 */
export function EditDocumentButton({
  id,
  type: initialType,
  year: initialYear,
  title: initialTitle,
  isActive: initialActive,
  types,
}: {
  id: string;
  type: string;
  year: number;
  title?: string;
  isActive: boolean;
  types: TypeOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [type, setType] = useState(initialType);
  const [year, setYear] = useState<number | "">(initialYear);
  const [title, setTitle] = useState(initialTitle ?? "");
  const [isActive, setIsActive] = useState(initialActive);

  function save() {
    const yearValue = Number(year);
    if (!yearValue || yearValue < 2000 || yearValue > 2100) {
      toast.error("Enter a valid year.");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/admin/documents/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          year: yearValue,
          title: title.trim() || undefined,
          isActive,
        }),
      });
      if (res.ok) {
        toast.success("Document updated.");
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message ?? "Could not update the document.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil className="size-3" />
            Edit
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit document</DialogTitle>
          <DialogDescription>
            Update the document details. To replace the file, delete this entry
            and upload a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
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

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Title (optional)</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Report 2025"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 accent-[#0a7d3e]"
            />
            Visible on the public About page
          </label>
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" size="sm" type="button">
                Cancel
              </Button>
            }
          />
          <Button size="sm" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
