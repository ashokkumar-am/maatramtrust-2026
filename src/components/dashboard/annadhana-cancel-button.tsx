"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
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

/** Cancel an annadhana booking (soft; the record is kept as "cancelled"). */
export function AnnadhanaCancelButton({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function cancelBooking() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/annadhana/bookings/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        toast.success("Booking cancelled.");
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message ?? "Could not cancel the booking.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Cancel booking">
            <Ban className="size-3.5" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this booking?</DialogTitle>
          <DialogDescription>
            It will be marked <strong>cancelled</strong> and stop counting
            toward campaign totals. The record is kept for your books.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" size="sm" type="button">
                Keep booking
              </Button>
            }
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={cancelBooking}
            disabled={pending}
          >
            {pending ? "Cancelling…" : "Cancel booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
