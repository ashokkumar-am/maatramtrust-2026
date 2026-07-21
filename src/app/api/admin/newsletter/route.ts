import { collectionHandlers } from "@/lib/crud-route";
import { newsletterRepository } from "@/lib/resources";
import { newsletterSchema } from "@/lib/validations";

export const { GET, POST } = collectionHandlers(
  newsletterRepository,
  newsletterSchema,
);
