import Image from "next/image";
import type { StudentProfile } from "@/lib/student-view";
import { educationDetail } from "@/lib/student-display";
import { Badge } from "@/components/ui/badge";

/** Public detail-page header: photo, name, type, and education context. */
export function StudentProfileHeader({ student }: { student: StudentProfile }) {
  const detail = educationDetail(student);

  return (
    <header className="flex flex-col gap-6 sm:flex-row">
      <div className="bg-muted relative aspect-square w-full shrink-0 overflow-hidden rounded-xl sm:w-56">
        {student.photo ? (
          <Image
            src={student.photo}
            alt={student.name}
            fill
            sizes="(max-width: 640px) 100vw, 224px"
            className="object-cover"
            priority
          />
        ) : (
          <Image
            src="/maatram_logo.png"
            alt={student.name}
            fill
            sizes="(max-width: 640px) 100vw, 224px"
            className="object-contain p-6"
            priority
          />
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {student.name}
          </h1>
          <Badge variant="secondary">{student.student_type}</Badge>
        </div>
        {detail && <p className="text-muted-foreground mt-1">{detail}</p>}
        {student.reason && (
          <p className="text-muted-foreground mt-4 max-w-2xl text-sm">
            {student.reason}
          </p>
        )}
      </div>
    </header>
  );
}
