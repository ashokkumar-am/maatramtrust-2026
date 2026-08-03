import { Suspense } from "react";
import { auth } from "@/auth";
import { getPublicStudents } from "@/lib/student-view";
import { StudentGrid } from "@/components/students/student-grid";
import { StudentGridSkeleton } from "@/components/students/student-grid-skeleton";

export const metadata = {
  title: "Sponsor a Student · Maatram",
};

export default async function StudentsPage() {
  // Don't await: the promise streams to the client grid via React `use`.
  const studentsPromise = getPublicStudents();
  const session = await auth();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Sponsor a Student
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Your sponsorship is recorded against the student for the current year.
        </p>
      </header>

      <Suspense fallback={<StudentGridSkeleton />}>
        <StudentGrid
          studentsPromise={studentsPromise}
          viewer={{
            signedIn: Boolean(session?.user),
            name: session?.user?.name ?? undefined,
            email: session?.user?.email ?? undefined,
          }}
        />
      </Suspense>
    </main>
  );
}
