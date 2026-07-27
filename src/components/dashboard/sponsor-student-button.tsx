"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HandHeart } from "lucide-react";
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

export function SponsorStudentButton({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number | "">(currentYear);
  const [amount, setAmount] = useState<number | "">("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [note, setNote] = useState("");

  function save() {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (!donorName.trim()) {
      toast.error("Enter the donor's name.");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/admin/students/${studentId}/sponsor`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: value,
          year: year === "" ? undefined : Number(year),
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim() || undefined,
          donorPhone: donorPhone.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Sponsorship recorded.");
        setOpen(false);
        setYear(currentYear);
        setAmount("");
        setDonorName("");
        setDonorEmail("");
        setDonorPhone("");
        setNote("");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      toast.error(data.message ?? "Could not record the sponsorship.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <HandHeart className="size-3" />
            Record sponsorship
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a sponsorship</DialogTitle>
          <DialogDescription>
            Captures the donor against {studentName} for the chosen year. Marked
            received immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Donor name</span>
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
              placeholder="Sends a confirmation if provided"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Donor phone (optional)</span>
            <Input
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
              placeholder="Donor phone"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Note (optional)</span>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. paid via bank transfer"
            />
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
            {pending ? "Saving…" : "Record sponsorship"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
