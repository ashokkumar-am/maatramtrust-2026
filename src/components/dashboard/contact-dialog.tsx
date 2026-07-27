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

export interface ContactValues {
  id: string;
  name: string;
  email: string;
  mobile: string;
  comments: string;
}

/**
 * Create or edit a contact submission. Without `contact` it renders a "New
 * contact" button that POSTs `/api/admin/contacts` (source stamped "admin");
 * with `contact` it renders an Edit button that PATCHes the entry.
 */
export function ContactDialog({ contact }: { contact?: ContactValues }) {
  const router = useRouter();
  const editing = Boolean(contact);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(contact?.name ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [mobile, setMobile] = useState(contact?.mobile ?? "");
  const [comments, setComments] = useState(contact?.comments ?? "");

  function save() {
    if (!name.trim() || !email.trim() || !mobile.trim() || !comments.trim()) {
      toast.error("All fields are required.");
      return;
    }

    startTransition(async () => {
      const res = await fetch(
        editing ? `/api/admin/contacts/${contact!.id}` : "/api/admin/contacts",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            comments: comments.trim(),
            ...(!editing && { isSource: "admin" }),
          }),
        },
      );

      if (res.ok) {
        toast.success(editing ? "Contact updated." : "Contact added.");
        setOpen(false);
        if (!editing) {
          setName("");
          setEmail("");
          setMobile("");
          setComments("");
        }
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      toast.error(data.message ?? "Could not save the contact.");
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
              New contact
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit contact" : "New contact"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the contact submission details."
              : "Record an enquiry received outside the website form."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Name</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
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
              <span className="text-sm font-medium">Mobile</span>
              <Input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Phone number"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Message</span>
            <Input
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="What is the enquiry about?"
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
            {pending ? "Saving…" : editing ? "Save changes" : "Add contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
