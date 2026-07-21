import { itemHandlers } from "@/lib/crud-route";
import { contactRepository } from "@/lib/resources";
import { contactUpdateSchema } from "@/lib/validations";

export const { GET, PATCH, DELETE } = itemHandlers(
  contactRepository,
  contactUpdateSchema,
);
