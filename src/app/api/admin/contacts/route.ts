import { collectionHandlers } from "@/lib/crud-route";
import { contactRepository } from "@/lib/resources";
import { contactSchema } from "@/lib/validations";

export const { GET, POST } = collectionHandlers(
  contactRepository,
  contactSchema,
);
