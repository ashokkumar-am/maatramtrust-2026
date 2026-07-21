import { studentRepository } from "@/lib/resources";
import type { AuditUser } from "@/lib/audit";
import type { StudentCreateInput, StudentUpdateInput } from "@/lib/validations";

/**
 * Student write operations used by Server Actions. Delegates to the shared
 * repository so audit stamping (`createdBy`/`updatedBy`) has a single source of
 * truth. Returns lean POJOs, safe to serialize to the client.
 */

export function createStudent(input: StudentCreateInput, actor: AuditUser) {
  return studentRepository.create(input, actor);
}

export function updateStudent(
  id: string,
  input: StudentUpdateInput,
  actor: AuditUser,
) {
  return studentRepository.update(id, input, actor);
}
