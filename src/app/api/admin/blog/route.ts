import { collectionHandlers } from "@/lib/crud-route";
import { blogRepository } from "@/lib/resources";
import { validateBlogCategoryRef } from "@/lib/blog";
import { BLOG_MANAGER_ROLES } from "@/lib/roles";
import { blogCreateSchema } from "@/lib/validations";

// GET (paginated list) + POST (create a blog post). 409 on duplicate slug;
// 400 when the referenced category doesn't exist. Editors manage the blog too.
export const { GET, POST } = collectionHandlers(
  blogRepository,
  blogCreateSchema,
  {
    validate: validateBlogCategoryRef,
    roles: BLOG_MANAGER_ROLES,
  },
);
