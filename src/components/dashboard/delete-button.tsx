"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

/**
 * Row action to delete an admin resource item. Confirms first, then calls
 * `DELETE /api/admin/<resource>/<id>` and refreshes the list.
 */
export function DeleteButton({
  resource,
  id,
  name,
  label,
}: {
  resource: string;
  id: string;
  name?: string;
  /** When set, render a labeled outline button instead of an icon-only one. */
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/${resource}/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Deleted.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Could not delete. Please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          label ? (
            <Button variant="outline" size="sm">
              <Trash2 className="size-3" />
              {label}
            </Button>
          ) : (
            <Button variant="ghost" size="icon-sm" aria-label="Delete">
              <Trash2 className="size-3.5" />
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this item?</DialogTitle>
          <DialogDescription>
            {name ? `"${name}" ` : "This item "}will be permanently removed.
            This can’t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" size="sm" type="button">
                Cancel
              </Button>
            }
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={remove}
            disabled={pending}
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
