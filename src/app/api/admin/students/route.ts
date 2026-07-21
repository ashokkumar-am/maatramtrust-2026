import { collectionHandlers } from "@/lib/crud-route";
import { studentRepository } from "@/lib/resources";
import { studentCreateSchema } from "@/lib/validations";

export const { GET, POST } = collectionHandlers(
  studentRepository,
  studentCreateSchema,
);
