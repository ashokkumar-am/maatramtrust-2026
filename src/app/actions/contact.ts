"use server";

import { createContact } from "@/lib/contacts";
import { contactSchema } from "@/lib/validations";

export interface ContactActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

/** Contact-page form submission: validate, persist, notify the team. */
export async function submitContact(
  input: unknown,
): Promise<ContactActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createContact({ ...parsed.data, isSource: "contact-page" });
    return { ok: true };
  } catch (error) {
    console.error("Failed to submit contact form:", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
