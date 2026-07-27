import { notFound } from "next/navigation";
import mongoose from "mongoose";
import connectMongoDB from "@/lib/mongoose";
import Student, {
  BLOOD_GROUPS,
  GENDERS,
  PARENTING_STATUSES,
  STUDENT_TYPES,
} from "@/models/StudentModel";
import { requireAdminPage } from "@/lib/dashboard-auth";
import {
  StudentForm,
  type StudentValues,
} from "@/components/dashboard/student-form";

export const metadata = { title: "Edit student · Maatram Admin" };

interface StudentDoc extends StudentValues {
  _id: unknown;
}

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdminPage(`/dashboard/students/${id}/edit`);

  if (!mongoose.isValidObjectId(id)) notFound();
  await connectMongoDB();
  const doc = await Student.findById(id)
    .select(
      "student_id name student_type amount originalAmount phonenumber gender blood_group reason marks school_name grade_level college_name department semester parenting_status photo aadhaar_number aadhaar_image pan_number pan_image mark_statement_image isDonate isStatus",
    )
    .lean<StudentDoc>()
    .exec();
  if (!doc) notFound();

  const { _id, ...rest } = doc;
  const initial: StudentValues = { id: String(_id), ...rest };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Edit student</h1>
      </header>
      <StudentForm
        initial={initial}
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
