import type { StudentProfile } from "@/lib/student-view";

/** One-line education context: school fields for School, college otherwise. */
export function educationDetail(student: StudentProfile): string {
  // Alumni carry college details, so only School uses school fields.
  const parts =
    student.student_type === "School"
      ? [student.school_name, student.grade_level]
      : [student.college_name, student.department, student.semester];
  return parts.filter(Boolean).join(" · ");
}
