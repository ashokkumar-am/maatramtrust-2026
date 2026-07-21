import { collectionHandlers } from "@/lib/crud-route";
import { blogRepository } from "@/lib/resources";
import { validateBlogCategoryRef } from "@/lib/blog";
import { blogCreateSchema } from "@/lib/validations";

// GET (paginated list) + POST (create a blog post). 409 on duplicate slug;
// 400 when the referenced category doesn't exist.
export const { GET, POST } = collectionHandlers(
  blogRepository,
  blogCreateSchema,
  {
    validate: validateBlogCategoryRef,
  },
);
