"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { useRazorpay } from "@/hooks/use-razorpay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RazorpaySuccessResponse } from "@/types/razorpay";

export interface BookingCampaign {
  id: string;
  title: string;
  minAmount: number;
}

const PRESETS = [1000, 2500, 5000, 10000];
const MIN_AMOUNT = 10;

const OCCASIONS = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "memorial", label: "In memory of a loved one" },
  { value: "other", label: "Other celebration" },
];

const selectClass =
  "border-input bg-background h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-[#0a7d3e]/40";

export function AnnadhanaBookingForm({
  campaigns,
  defaultName = "",
  defaultEmail = "",
}: {
  campaigns: BookingCampaign[];
  defaultName?: string;
  defaultEmail?: string;
}) {
  const { isReady, load } = useRazorpay();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const today = new Date().toISOString().slice(0, 10);
  const [occasion, setOccasion] = useState("birthday");
  const [occasionDetail, setOccasionDetail] = useState("");
  const [honoreeName, setHonoreeName] = useState("");
  const [eventDate, setEventDate] = useState(today);
  const [campaignId, setCampaignId] = useState("");
  const [amount, setAmount] = useState<number | "">(1000);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const campaign = campaigns.find((c) => c.id === campaignId);
  const minAmount = Math.max(MIN_AMOUNT, campaign?.minAmount ?? 0);

  async function confirmBooking(res: RazorpaySuccessResponse) {
    const response = await fetch("/api/v1/annadhana/bookings/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderId: res.razorpay_order_id,
        paymentId: res.razorpay_payment_id,
        signature: res.razorpay_signature,
      }),
    });
    const data = await response.json();
    if (response.ok && data.ok) {
      toast.success("Your Annadhana Sevai booking is confirmed. 💚");
      router.refresh();
    } else {
      toast.error("We couldn't verify the payment. Please contact support.");
    }
  }

  function book() {
    const value = Number(amount);
    if (!value || value < minAmount) {
      toast.error(`Enter an amount of ₹${minAmount} or more.`);
      return;
    }
    if (!eventDate || eventDate < today) {
      toast.error("Pick today or a future date for the annadhanam.");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email so we can confirm your booking.");
      return;
    }
    if (!isReady) {
      load();
      toast.info("Payment is still loading — try again in a moment.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/v1/annadhana/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          occasion,
          occasionDetail: occasionDetail.trim() || undefined,
          honoreeName: honoreeName.trim() || undefined,
          eventDate,
          campaignId: campaignId || undefined,
          amount: value,
          donorName: name.trim() || undefined,
          donorEmail: email.trim() || undefined,
          donorPhone: phone.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });
      const order = await res.json();
      if (!res.ok) {
        toast.error(order.message ?? "Could not start the payment.");
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Maatram",
        description: "Annadhana Sevai booking",
        prefill: { name: name || undefined, email: email || undefined },
        theme: { color: "#0a7d3e" },
        handler: (success: RazorpaySuccessResponse) =>
          startTransition(() => confirmBooking(success)),
        modal: { ondismiss: () => toast.info("Payment cancelled.") },
      });
      rzp.open();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
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
          <span className="text-sm font-medium">Date of the annadhanam</span>
          <Input
            type="date"
            min={today}
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

      {campaigns.length > 0 && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Campaign (optional)</span>
          <select
            className={selectClass}
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
          >
            <option value="">General Annadhana Sevai</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          {campaign && campaign.minAmount > 0 && (
            <span className="text-muted-foreground text-xs">
              Minimum for this campaign: ₹
              {campaign.minAmount.toLocaleString("en-IN")}
            </span>
          )}
        </label>
      )}

      <div>
        <span className="mb-2 block text-sm font-medium">Amount</span>
        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              size="sm"
              variant={amount === preset ? "default" : "outline"}
              onClick={() => setAmount(preset)}
            >
              ₹{preset.toLocaleString("en-IN")}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">₹</span>
          <Input
            type="number"
            min={minAmount}
            inputMode="numeric"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Enter an amount"
          />
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Name</span>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Email</span>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <span className="text-muted-foreground text-xs">
            Your booking confirmation is sent here.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Phone (optional)</span>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9000012345"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Message (optional)</span>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything we should know"
        />
      </label>

      <Button
        type="button"
        onClick={book}
        onMouseEnter={load}
        disabled={pending}
        className="mt-1"
      >
        <UtensilsCrossed className="size-4" />
        {pending ? "Processing…" : "Book Annadhana Sevai"}
      </Button>
    </div>
  );
}
