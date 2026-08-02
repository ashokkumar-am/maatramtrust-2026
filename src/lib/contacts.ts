import connectMongoDB from "@/lib/mongoose";
import Contact from "@/models/ContactModel";
import { triggerEmail } from "@/lib/email";
import type { ContactInput } from "@/lib/validations";

/**
 * Persist a contact enquiry and notify the team by email. Shared by the
 * public API route and the contact-page Server Action.
 */
export async function createContact(input: ContactInput): Promise<void> {
  await connectMongoDB();
  await Contact.create(input);

  triggerEmail("contact.created", {
    name: input.name,
    email: input.email,
    mobile: input.mobile,
    comments: input.comments,
  });
}
