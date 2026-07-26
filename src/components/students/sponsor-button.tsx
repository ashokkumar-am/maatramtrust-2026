"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import {
  confirmStudentSponsorship,
  createStudentSponsorshipOrder,
} from "@/app/actions/sponsor";
import { useRazorpay } from "@/hooks/use-razorpay";
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
import type { RazorpaySuccessResponse } from "@/types/razorpay";

type SponsorStudent = { id: string; name: string; amount: number };

/** Login page URL that returns the user to the sponsor listing afterwards. */
const SIGN_IN_URL = "/login?callbackUrl=%2Fstudents";

export function SponsorButton({
  student,
  funded = false,
  signedIn = false,
}: {
  student: SponsorStudent;
  funded?: boolean;
  /** Only registered users can sponsor; guests are sent to sign in. */
  signedIn?: boolean;
}) {
  const { isReady, load } = useRazorpay();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState<number | "">(student.amount || 1000);

  function sponsor() {
    const value = Number(amount);
    if (!value || value < 10) {
      toast.error("Enter an amount of ₹10 or more.");
      return;
    }
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }
    if (!isReady) {
      load();
      toast.info("Payment is still loading — try again in a moment.");
      return;
    }

    startTransition(async () => {
      const order = await createStudentSponsorshipOrder({
        studentId: student.id,
        amount: value,
        donorName: name.trim(),
        donorEmail: email.trim(),
        donorPhone: phone.trim() || undefined,
      });
      if (!order.ok) {
        if (order.requiresSignIn) {
          toast.info(order.error);
          router.push(SIGN_IN_URL);
          return;
        }
        toast.error(order.error);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Maatram",
        description: `Sponsor ${student.name}`,
        prefill: { name, email, contact: phone || undefined },
        theme: { color: "#0a7d3e" },
        handler: (res: RazorpaySuccessResponse) => {
          startTransition(async () => {
            const result = await confirmStudentSponsorship({
              orderId: res.razorpay_order_id,
              paymentId: res.razorpay_payment_id,
              signature: res.razorpay_signature,
            });
            if (result.ok) {
              toast.success(`Thank you for sponsoring ${student.name}! 💚`);
              setOpen(false);
              // Refresh so the funded student updates + sorts down.
              router.refresh();
            } else {
              toast.error("We couldn't verify the payment. Contact support.");
            }
          });
        },
        modal: { ondismiss: () => toast.info("Payment cancelled.") },
      });
      rzp.open();
    });
  }

  if (funded) {
    return (
      <Button size="sm" variant="secondary" disabled>
        <CheckCircle2 className="size-4" />
        Sponsored
      </Button>
    );
  }

  if (!signedIn) {
    return (
      <Button size="sm" onClick={() => router.push(SIGN_IN_URL)}>
        <HeartHandshake className="size-4" />
        Sign in to sponsor
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" onMouseEnter={load}>
            <HeartHandshake className="size-4" />
            Sponsor
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sponsor {student.name}</DialogTitle>
          <DialogDescription>
            Your contribution is recorded against this student for the current
            year.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">₹</span>
            <Input
              type="number"
              min={10}
              inputMode="numeric"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="Amount"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" size="sm" type="button">
                Cancel
              </Button>
            }
          />
          <Button size="sm" onClick={sponsor} disabled={pending}>
            {pending ? "Processing…" : "Sponsor now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
