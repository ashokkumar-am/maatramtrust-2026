import { collectionHandlers } from "@/lib/crud-route";
import { documentRepository } from "@/lib/resources";
import { documentCreateSchema } from "@/lib/validations";

// GET (paginated list) + POST (record metadata after the S3 upload succeeds).
export const { GET, POST } = collectionHandlers(
  documentRepository,
  documentCreateSchema,
);
