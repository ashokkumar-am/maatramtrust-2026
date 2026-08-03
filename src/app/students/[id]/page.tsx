import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import {
  getPublicSponsorYears,
  getPublicStudentProfile,
} from "@/lib/student-view";
import { StudentProfileHeader } from "@/components/students/student-profile-header";
import { SponsorYearPanel } from "@/components/students/sponsor-year-panel";
import { SponsorYearSkeleton } from "@/components/students/sponsor-year-skeleton";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const student = await getPublicStudentProfile(id);
  return {
    title: student
      ? `Sponsor ${student.name} · Maatram`
      : "Student not found · Maatram",
  };
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Don't await: the promise streams to the sponsor panel via React `use`.
  const yearsPromise = getPublicSponsorYears(id);
  const [student, session] = await Promise.all([
    getPublicStudentProfile(id),
    auth(),
  ]);
  if (!student) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/students"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        All students
      </Link>

      <div className="flex flex-col gap-8">
        <StudentProfileHeader student={student} />

        <Suspense fallback={<SponsorYearSkeleton />}>
          <SponsorYearPanel
            yearsPromise={yearsPromise}
            student={{
              id: student.id,
              name: student.name,
              amount: student.amount,
            }}
            viewer={{
              signedIn: Boolean(session?.user),
              name: session?.user?.name ?? undefined,
              email: session?.user?.email ?? undefined,
            }}
          />
        </Suspense>
      </div>
    </main>
  );
}
