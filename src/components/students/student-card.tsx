import Image from "next/image";
import Link from "next/link";
import type { StudentView } from "@/lib/student-view";
import { educationDetail } from "@/lib/student-display";
import {
  SponsorButton,
  type SponsorViewer,
} from "@/components/students/sponsor-button";
import { SponsorHistory } from "@/components/students/sponsor-history";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { inr } from "@/lib/utils";

function StudentPhoto({ photo, name }: { photo?: string; name: string }) {
  return (
    <div className="bg-muted relative aspect-video w-full">
      {photo ? (
        <Image
          src={photo}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover"
        />
      ) : (
        <div className="text-muted-foreground flex h-full items-center justify-center text-4xl font-semibold">
          {name.charAt(0)}
        </div>
      )}
    </div>
  );
}

function FundingStatus({ student }: { student: StudentView }) {
  if (student.funded) {
    return <span className="text-emerald-600">Fully funded</span>;
  }
  return (
    <>
      {inr(student.receivedThisYear)} / {inr(student.amount)}
    </>
  );
}

/** Public card for one student: photo, context, sponsor history, and CTA. */
export function StudentCard({
  student,
  viewer,
}: {
  student: StudentView;
  viewer: SponsorViewer;
}) {
  const detail = educationDetail(student);

  return (
    <Card className="flex flex-col overflow-hidden">
      <Link href={`/students/${student.id}`} aria-label={student.name}>
        <StudentPhoto photo={student.photo} name={student.name} />
      </Link>

      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>
            <Link href={`/students/${student.id}`} className="hover:underline">
              {student.name}
            </Link>
          </CardTitle>
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
        <SponsorHistory sponsorsByYear={student.sponsorsByYear} />
      </CardContent>

      <CardFooter className="items-center justify-between">
        <span className="text-sm font-medium">
          <FundingStatus student={student} />
        </span>
        <SponsorButton
          funded={student.funded}
          viewer={viewer}
          student={{
            id: student.id,
            name: student.name,
            amount: student.amount,
          }}
        />
      </CardFooter>
    </Card>
  );
}
