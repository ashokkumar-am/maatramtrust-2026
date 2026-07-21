"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
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

/** Void/refund a captured donation (soft; keeps the record as "refunded"). */
export function VoidDonationButton({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");

  function voidDonation() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/donations/${id}/void`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      if (res.ok) {
        toast.success("Donation voided.");
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message ?? "Could not void the donation.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Void / refund">
            <Ban className="size-3.5" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void this donation?</DialogTitle>
          <DialogDescription>
            It will be marked <strong>refunded</strong> and stop counting toward
            totals and the public wall. The record is kept for your books.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional) — e.g. refunded, entered by mistake"
        />
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
            onClick={voidDonation}
            disabled={pending}
          >
            {pending ? "Voiding…" : "Void donation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
