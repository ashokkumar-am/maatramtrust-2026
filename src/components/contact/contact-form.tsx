"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { submitContact } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EMPTY_FORM = { name: "", email: "", mobile: "", comments: "" };

type Field = keyof typeof EMPTY_FORM;

/** Contact enquiry form → `submitContact` Server Action, with field errors. */
export function ContactForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<Field, string>>
  >({});
  const [pending, startTransition] = useTransition();

  const set = (field: Field) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await submitContact(form);
      if (result.ok) {
        toast.success("Thank you! We'll get back to you soon.");
        setForm(EMPTY_FORM);
        setFieldErrors({});
        return;
      }
      setFieldErrors({
        name: result.fieldErrors?.name?.[0],
        email: result.fieldErrors?.email?.[0],
        mobile: result.fieldErrors?.mobile?.[0],
        comments: result.fieldErrors?.comments?.[0],
      });
      toast.error(result.error ?? "Something went wrong.");
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <FormField label="Your name" error={fieldErrors.name}>
        <Input
          value={form.name}
          onChange={(e) => set("name")(e.target.value)}
          placeholder="Full name"
          autoComplete="name"
        />
      </FormField>

      <FormField label="Email" error={fieldErrors.email}>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => set("email")(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </FormField>

      <FormField label="Mobile" error={fieldErrors.mobile}>
        <Input
          type="tel"
          value={form.mobile}
          onChange={(e) => set("mobile")(e.target.value)}
          placeholder="Phone number"
          autoComplete="tel"
        />
      </FormField>

      <FormField label="How can we help?" error={fieldErrors.comments}>
        <textarea
          value={form.comments}
          onChange={(e) => set("comments")(e.target.value)}
          placeholder="Tell us about your enquiry — donations, volunteering, sponsorships…"
          rows={5}
          className="border-input placeholder:text-muted-foreground focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:outline-none"
        />
      </FormField>

      <Button type="submit" disabled={pending} className="w-fit">
        <Send className="size-4" />
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span className="text-destructive text-xs">{error}</span>}
    </label>
  );
}
