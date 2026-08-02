"use client";

import { use } from "react";
import type { getPublicStudents } from "@/lib/student-view";
import { StudentCard } from "@/components/students/student-card";

interface StudentGridProps {
  /** Started (not awaited) in the Server Component; resolved here via `use`. */
  studentsPromise: ReturnType<typeof getPublicStudents>;
  signedIn: boolean;
}

/**
 * Streams in the sponsor-a-student grid: React suspends rendering here until
 * the students promise resolves, so the page shell paints immediately.
 */
export function StudentGrid({ studentsPromise, signedIn }: StudentGridProps) {
  const students = use(studentsPromise);

  if (students.length === 0) {
    return (
      <p className="text-muted-foreground">No students available right now.</p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {students.map((student) => (
        <StudentCard key={student.id} student={student} signedIn={signedIn} />
      ))}
    </div>
  );
}
