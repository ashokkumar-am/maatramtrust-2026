import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import connectMongoDB from "@/lib/mongoose";
import Student from "@/models/StudentModel";
import { requireAdminPage } from "@/lib/dashboard-auth";
import {
  getStudentSponsorshipsByYear,
  type SponsorshipRecord,
  type YearSponsorships,
} from "@/lib/sponsorships";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SponsorStudentButton } from "@/components/dashboard/sponsor-student-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Student sponsorships · Maatram Admin" };

interface StudentDoc {
  _id: unknown;
  student_id: string;
  name: string;
  student_type: string;
  amount?: number;
}

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const STATUS_VARIANT: Record<
  SponsorshipRecord["status"],
  "default" | "secondary" | "destructive"
> = {
  received: "default",
  pending: "secondary",
  failed: "destructive",
};

function YearCard({ bucket }: { bucket: YearSponsorships }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{bucket.year}</CardTitle>
        <CardDescription>
          {bucket.count} sponsorship{bucket.count === 1 ? "" : "s"} ·{" "}
          {inr(bucket.received)} received of {inr(bucket.pledged)} pledged
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Pledged</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bucket.sponsorships.map((s) => (
                <TableRow key={String(s._id)}>
                  <TableCell className="font-medium">
                    {s.donorName?.trim() || "Anonymous"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.donorEmail ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.donorPhone ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {inr(s.amount ?? 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {inr(s.receivedAmt ?? 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {s.createdAt ? format(s.createdAt, "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.note ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Admin view of one student: sponsorship goal plus every donor captured
 * against the student, grouped year-wise, with a way to record new ones.
 */
export default async function StudentSponsorshipsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdminPage(`/dashboard/students/${id}`);

  if (!mongoose.isValidObjectId(id)) notFound();
  await connectMongoDB();

  const [doc, years] = await Promise.all([
    Student.findById(id)
      .select("student_id name student_type amount")
      .lean<StudentDoc>()
      .exec(),
    getStudentSponsorshipsByYear(id),
  ]);
  if (!doc) notFound();

  const totalReceived = years.reduce((sum, y) => sum + y.received, 0);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{doc.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            <span className="font-mono">{doc.student_id}</span> ·{" "}
            {doc.student_type} · goal {inr(doc.amount ?? 0)}/year ·{" "}
            {inr(totalReceived)} received all-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/students/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Pencil className="size-3" />
            Edit
          </Link>
          <SponsorStudentButton studentId={id} studentName={doc.name} />
        </div>
      </header>

      {years.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No sponsorships recorded for this student yet.
        </p>
      ) : (
        years.map((bucket) => <YearCard key={bucket.year} bucket={bucket} />)
      )}
    </div>
  );
}
