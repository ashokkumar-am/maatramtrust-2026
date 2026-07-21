import { itemHandlers } from "@/lib/crud-route";
import { studentRepository } from "@/lib/resources";
import { studentUpdateSchema } from "@/lib/validations";

export const { GET, PATCH, DELETE } = itemHandlers(
  studentRepository,
  studentUpdateSchema,
);
