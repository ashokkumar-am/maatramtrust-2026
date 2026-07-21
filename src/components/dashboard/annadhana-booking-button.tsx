"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
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

export interface CampaignOption {
  id: string;
  title: string;
}

const selectClass =
  "border-input bg-background h-9 rounded-md border px-3 text-sm";

const OCCASIONS = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "memorial", label: "In memory of a loved one" },
  { value: "other", label: "Other celebration" },
];

/** Record an offline Annadhana Sevai booking (admin; received immediately). */
export function AnnadhanaBookingButton({
  campaigns,
}: {
  campaigns: CampaignOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const today = new Date().toISOString().slice(0, 10);
  const [occasion, setOccasion] = useState("birthday");
  const [occasionDetail, setOccasionDetail] = useState("");
  const [honoreeName, setHonoreeName] = useState("");
  const [eventDate, setEventDate] = useState(today);
  const [campaignId, setCampaignId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [note, setNote] = useState("");

  function reset() {
    setOccasion("birthday");
    setOccasionDetail("");
    setHonoreeName("");
    setEventDate(today);
    setCampaignId("");
    setAmount("");
    setDonorName("");
    setDonorEmail("");
    setDonorPhone("");
    setNote("");
  }

  function save() {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (!eventDate) {
      toast.error("Pick the event date.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/annadhana/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          occasion,
          occasionDetail: occasionDetail.trim() || undefined,
          honoreeName: honoreeName.trim() || undefined,
          eventDate,
          campaignId: campaignId || undefined,
          amount: value,
          donorName: donorName.trim() || undefined,
          donorEmail: donorEmail.trim() || undefined,
          donorPhone: donorPhone.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Booking recorded.");
        setOpen(false);
        reset();
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      toast.error(data.message ?? "Could not record the booking.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <UtensilsCrossed className="size-3" />
            Record booking
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record an Annadhana Sevai booking</DialogTitle>
          <DialogDescription>
            Offline bookings are marked received immediately. Past event dates
            are allowed for backfilling history.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Occasion</span>
              <select
                className={selectClass}
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
              >
                {OCCASIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Event date</span>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </label>
          </div>

          {occasion === "other" && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">What celebration?</span>
              <Input
                value={occasionDetail}
                onChange={(e) => setOccasionDetail(e.target.value)}
                placeholder="e.g. housewarming, retirement"
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">
              {occasion === "memorial"
                ? "In memory of (optional)"
                : "Celebrant (optional)"}
            </span>
            <Input
              value={honoreeName}
              onChange={(e) => setHonoreeName(e.target.value)}
              placeholder="Person celebrated or remembered"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
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

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Campaign (optional)</span>
              <select
                className={selectClass}
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
              >
                <option value="">None</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
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

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                Donor email (optional)
              </span>
              <Input
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder="Emails a confirmation"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                Donor phone (optional)
              </span>
              <Input
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                placeholder="9000012345"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Note (optional)</span>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. paid by cheque no. 001234"
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
            {pending ? "Saving…" : "Record booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
