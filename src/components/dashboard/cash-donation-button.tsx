"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HandCoins } from "lucide-react";
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

export interface CategoryOption {
  id: string;
  name: string;
}

const selectClass =
  "border-input bg-background h-9 rounded-md border px-3 text-sm";

export function CashDonationButton({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState<number | "">("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [method, setMethod] = useState("cash");
  const [receivedAt, setReceivedAt] = useState(today);
  const [note, setNote] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  function save() {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/donations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: value,
          donorName: donorName.trim() || undefined,
          donorEmail: donorEmail.trim() || undefined,
          anonymous,
          categoryId: categoryId || undefined,
          method,
          receivedAt: receivedAt || undefined,
          note: note.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Cash donation recorded.");
        setOpen(false);
        setAmount("");
        setDonorName("");
        setDonorEmail("");
        setCategoryId("");
        setReceivedAt(today);
        setNote("");
        setAnonymous(false);
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      toast.error(data.message ?? "Could not record the donation.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <HandCoins className="size-3" />
            Record cash donation
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a cash donation</DialogTitle>
          <DialogDescription>
            Offline donations are captured immediately and count toward the
            dashboard totals.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Amount (₹)</span>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="Amount received"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Method</span>
              <select
                className={selectClass}
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="bank_transfer">Bank transfer</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Category (optional)</span>
              <select
                className={selectClass}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Donor name (optional)</span>
            <Input
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Donor name"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Donor email (optional)</span>
            <Input
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              placeholder="Emails a PDF receipt if provided"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Received on</span>
            <Input
              type="date"
              value={receivedAt}
              max={today}
              onChange={(e) => setReceivedAt(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">
              Reference / note (optional)
            </span>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. cheque no. 001234"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="size-4 accent-[#0a7d3e]"
            />
            Anonymous (hide the name on the public wall)
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
            {pending ? "Saving…" : "Record donation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
