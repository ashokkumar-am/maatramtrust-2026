import Link from "next/link";
import { Plus } from "lucide-react";
import connectMongoDB from "@/lib/mongoose";
import Student from "@/models/StudentModel";
import { requireAdminPage } from "@/lib/dashboard-auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  StudentsList,
  type StudentRow,
} from "@/components/dashboard/students-list";

const PAGE_SIZE = 20;

interface Doc {
  _id: unknown;
  student_id: string;
  name: string;
  student_type: string;
  amount: number;
  isDonate?: boolean;
  createdAt?: Date;
}

export const metadata = { title: "Students · Maatram Admin" };

export default async function AdminStudentsPage() {
  await requireAdminPage("/dashboard/students");
  await connectMongoDB();

  const [docs, total] = await Promise.all([
    Student.find()
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE)
      .select("student_id name student_type amount isDonate createdAt")
      .lean<Doc[]>()
      .exec(),
    Student.estimatedDocumentCount(),
  ]);

  const initialItems: StudentRow[] = docs.map((d) => ({
    id: String(d._id),
    student_id: d.student_id,
    name: d.name,
    student_type: d.student_type,
    amount: d.amount,
    isDonate: d.isDonate,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
  }));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {total} students.
          </p>
        </div>
        <Link
          href="/dashboard/students/new"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          <Plus className="size-3" />
          New student
        </Link>
      </header>

      <StudentsList initialItems={initialItems} pageSize={PAGE_SIZE} />
    </div>
  );
}
