import { requireAdminPage } from "@/lib/dashboard-auth";
import {
  BLOOD_GROUPS,
  GENDERS,
  PARENTING_STATUSES,
  STUDENT_TYPES,
} from "@/models/StudentModel";
import { StudentForm } from "@/components/dashboard/student-form";

export const metadata = { title: "New student · Maatram Admin" };

export default async function NewStudentPage() {
  await requireAdminPage("/dashboard/students/new");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New student</h1>
      </header>
      <StudentForm
        options={{
          studentTypes: [...STUDENT_TYPES],
          genders: [...GENDERS],
          bloodGroups: [...BLOOD_GROUPS],
          parentingStatuses: [...PARENTING_STATUSES],
        }}
      />
    </div>
  );
}
