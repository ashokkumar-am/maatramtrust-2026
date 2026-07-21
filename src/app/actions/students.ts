"use server";

import { revalidatePath } from "next/cache";
import { getAuditUser } from "@/lib/audit";
import { createStudent, updateStudent } from "@/lib/students";
import { studentCreateSchema, studentUpdateSchema } from "@/lib/validations";

type FieldErrors = Record<string, string[] | undefined>;

export type StudentActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

/**
 * Create a student. Requires an authenticated user; stamps them as both
 * `createdBy` and `updatedBy` via the service layer.
 */
export async function createStudentAction(
  input: unknown,
): Promise<StudentActionResult> {
  const actor = await getAuditUser();
  if (!actor) {
    return { ok: false, error: "You must be signed in to do that." };
  }

  const parsed = studentCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const student = await createStudent(parsed.data, actor);
    revalidatePath("/dashboard");
    return { ok: true, id: String(student._id) };
  } catch (error) {
    console.error("[students] create failed", error);
    return { ok: false, error: "Could not create the student." };
  }
}

/**
 * Update a student by id. Requires an authenticated user; stamps them as
 * `updatedBy` (leaving `createdBy` untouched).
 */
export async function updateStudentAction(
  id: string,
  input: unknown,
): Promise<StudentActionResult> {
  const actor = await getAuditUser();
  if (!actor) {
    return { ok: false, error: "You must be signed in to do that." };
  }

  if (!id) {
    return { ok: false, error: "Missing student id." };
  }

  const parsed = studentUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const student = await updateStudent(id, parsed.data, actor);
    if (!student) {
      return { ok: false, error: "Student not found." };
    }
    revalidatePath("/dashboard");
    return { ok: true, id: String(student._id) };
  } catch (error) {
    console.error("[students] update failed", error);
    return { ok: false, error: "Could not update the student." };
  }
}
