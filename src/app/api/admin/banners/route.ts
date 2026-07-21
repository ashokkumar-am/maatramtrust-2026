import { collectionHandlers } from "@/lib/crud-route";
import { bannerRepository } from "@/lib/resources";
import { bannerCreateSchema } from "@/lib/validations";

export const { GET, POST } = collectionHandlers(
  bannerRepository,
  bannerCreateSchema,
);
