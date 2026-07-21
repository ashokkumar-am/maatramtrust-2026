import Image from "next/image";
import { getPublicStudents } from "@/lib/student-view";
import { SponsorButton } from "@/components/students/sponsor-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Sponsor a Student · Maatram",
};

export default async function StudentsPage() {
  const students = await getPublicStudents();

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

      {students.length === 0 ? (
        <p className="text-muted-foreground">
          No students available right now.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => {
            const detail =
              student.student_type === "College"
                ? [student.college_name, student.department, student.semester]
                    .filter(Boolean)
                    .join(" · ")
                : [student.school_name, student.grade_level]
                    .filter(Boolean)
                    .join(" · ");

            return (
              <Card key={student.id} className="flex flex-col overflow-hidden">
                <div className="bg-muted relative aspect-video w-full">
                  {student.photo ? (
                    <Image
                      src={student.photo}
                      alt={student.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full items-center justify-center text-4xl font-semibold">
                      {student.name.charAt(0)}
                    </div>
                  )}
                </div>

                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{student.name}</CardTitle>
                    <Badge variant="secondary">{student.student_type}</Badge>
                  </div>
                  {detail && <CardDescription>{detail}</CardDescription>}
                </CardHeader>

                <CardContent className="flex-1 space-y-3">
                  {student.reason && (
                    <p className="text-muted-foreground line-clamp-4 text-sm">
                      {student.reason}
                    </p>
                  )}

                  {student.sponsorsByYear.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                        Sponsors
                      </p>
                      <ul className="space-y-0.5 text-sm">
                        {student.sponsorsByYear.map((entry) => (
                          <li key={entry.year}>
                            <span className="font-medium">{entry.year}:</span>{" "}
                            {entry.names.join(", ")}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="items-center justify-between">
                  <span className="text-sm font-medium">
                    {student.funded ? (
                      <span className="text-emerald-600">Fully funded</span>
                    ) : (
                      <>
                        ₹{student.receivedThisYear.toLocaleString("en-IN")} / ₹
                        {student.amount.toLocaleString("en-IN")}
                      </>
                    )}
                  </span>
                  <SponsorButton
                    funded={student.funded}
                    student={{
                      id: student.id,
                      name: student.name,
                      amount: student.amount,
                    }}
                  />
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
