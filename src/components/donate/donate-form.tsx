"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { useRazorpay } from "@/hooks/use-razorpay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RazorpaySuccessResponse } from "@/types/razorpay";

export interface DonateCategory {
  id: string;
  name: string;
}

const PRESETS = [500, 1000, 2500, 5000];
const MIN_AMOUNT = 10;

export function DonateForm({
  categories,
  defaultName = "",
  defaultEmail = "",
}: {
  categories: DonateCategory[];
  defaultName?: string;
  defaultEmail?: string;
}) {
  const { isReady, load } = useRazorpay();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [amount, setAmount] = useState<number | "">(1000);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [categoryId, setCategoryId] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  async function confirmDonation(res: RazorpaySuccessResponse) {
    const response = await fetch("/api/v1/donations/confirm", {
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
      toast.success("Thank you! Your receipt is on its way. 💚");
      router.refresh();
    } else {
      toast.error("We couldn't verify the payment. Please contact support.");
    }
  }

  function donate() {
    const value = Number(amount);
    if (!value || value < MIN_AMOUNT) {
      toast.error(`Enter an amount of ₹${MIN_AMOUNT} or more.`);
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email so we can send your receipt.");
      return;
    }
    if (!isReady) {
      load();
      toast.info("Payment is still loading — try again in a moment.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/v1/donations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: value,
          donorName: name.trim() || undefined,
          donorEmail: email.trim() || undefined,
          anonymous,
          categoryId: categoryId || undefined,
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
        description: "Donation",
        prefill: { name: name || undefined, email: email || undefined },
        theme: { color: "#0a7d3e" },
        handler: (success: RazorpaySuccessResponse) =>
          startTransition(() => confirmDonation(success)),
        modal: { ondismiss: () => toast.info("Payment cancelled.") },
      });
      rzp.open();
    });
  }

  return (
    <div className="flex flex-col gap-5">
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
            min={MIN_AMOUNT}
            inputMode="numeric"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Enter an amount"
          />
        </div>
      </div>

      {categories.length > 0 && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Category (optional)</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border-input bg-background h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-[#0a7d3e]/40"
          >
            <option value="">General donation</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Name</span>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Email</span>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <span className="text-muted-foreground text-xs">
          Your donation receipt (PDF) is sent here.
        </span>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="size-4 accent-[#0a7d3e]"
        />
        Donate anonymously (hide my name on the public wall)
      </label>

      <Button
        type="button"
        onClick={donate}
        onMouseEnter={load}
        disabled={pending}
        className="mt-1"
      >
        <HeartHandshake className="size-4" />
        {pending ? "Processing…" : "Donate now"}
      </Button>
    </div>
  );
}
