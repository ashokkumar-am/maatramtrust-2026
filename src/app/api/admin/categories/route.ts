import { collectionHandlers } from "@/lib/crud-route";
import { categoryRepository } from "@/lib/resources";
import { validateCategoryParent } from "@/lib/categories";
import { categoryCreateSchema } from "@/lib/validations";

// GET (list) + POST (create). 409 on duplicate slug; 400 if parent is unknown.
export const { GET, POST } = collectionHandlers(
  categoryRepository,
  categoryCreateSchema,
  { validate: validateCategoryParent },
);
