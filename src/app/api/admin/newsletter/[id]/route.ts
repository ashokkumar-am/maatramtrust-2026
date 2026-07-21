import { itemHandlers } from "@/lib/crud-route";
import { newsletterRepository } from "@/lib/resources";
import { newsletterUpdateSchema } from "@/lib/validations";

export const { GET, PATCH, DELETE } = itemHandlers(
  newsletterRepository,
  newsletterUpdateSchema,
);
