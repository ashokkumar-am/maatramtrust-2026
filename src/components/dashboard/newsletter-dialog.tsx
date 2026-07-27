"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
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

export interface SubscriberValues {
  id: string;
  email: string;
  isSource?: string;
}

/**
 * Create or edit a newsletter subscriber. Without `subscriber` it renders a
 * "New subscriber" button that POSTs `/api/admin/newsletter` (source stamped
 * "admin"); with `subscriber` it renders an Edit button that PATCHes the entry.
 */
export function NewsletterDialog({
  subscriber,
}: {
  subscriber?: SubscriberValues;
}) {
  const router = useRouter();
  const editing = Boolean(subscriber);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [email, setEmail] = useState(subscriber?.email ?? "");
  const [source, setSource] = useState(subscriber?.isSource ?? "admin");

  function save() {
    if (!email.trim()) {
      toast.error("Enter the subscriber's email.");
      return;
    }

    startTransition(async () => {
      const res = await fetch(
        editing
          ? `/api/admin/newsletter/${subscriber!.id}`
          : "/api/admin/newsletter",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            isSource: source.trim() || undefined,
          }),
        },
      );

      if (res.ok) {
        toast.success(editing ? "Subscriber updated." : "Subscriber added.");
        setOpen(false);
        if (!editing) {
          setEmail("");
          setSource("admin");
        }
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      toast.error(
        data.message === "Already exists"
          ? "That email is already subscribed."
          : (data.message ?? "Could not save the subscriber."),
      );
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          editing ? (
            <Button variant="outline" size="sm">
              <Pencil className="size-3" />
              Edit
            </Button>
          ) : (
            <Button size="sm">
              <Plus className="size-3" />
              New subscriber
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit subscriber" : "New subscriber"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the subscriber's details."
              : "Add someone who asked to receive the newsletter."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Email</span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Source</span>
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. admin, website, event"
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
            {pending ? "Saving…" : editing ? "Save changes" : "Add subscriber"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
