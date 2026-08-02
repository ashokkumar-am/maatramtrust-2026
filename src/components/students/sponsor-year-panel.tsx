"use client";

import { use } from "react";
import type { getPublicSponsorYears, StudentProfile } from "@/lib/student-view";
import { SponsorButton } from "@/components/students/sponsor-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { inr } from "@/lib/utils";

interface SponsorYearPanelProps {
  /** Started (not awaited) in the Server Component; resolved here via `use`. */
  yearsPromise: ReturnType<typeof getPublicSponsorYears>;
  student: Pick<StudentProfile, "id" | "name" | "amount">;
  signedIn: boolean;
}

function FundingSummary({
  student,
  receivedThisYear,
  funded,
  signedIn,
}: {
  student: SponsorYearPanelProps["student"];
  receivedThisYear: number;
  funded: boolean;
  signedIn: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>This year</CardTitle>
        <CardDescription>
          {funded ? (
            <span className="text-emerald-600">Fully funded — thank you!</span>
          ) : (
            <>
              {inr(receivedThisYear)} received of {inr(student.amount)} goal
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SponsorButton funded={funded} signedIn={signedIn} student={student} />
      </CardContent>
    </Card>
  );
}

function YearCard({
  year,
}: {
  year: Awaited<SponsorYearPanelProps["yearsPromise"]>[number];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{year.year}</CardTitle>
        <CardDescription>
          {year.count} sponsorship{year.count === 1 ? "" : "s"} ·{" "}
          {inr(year.received)} received
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="text-sm">
          {year.names.map((name, index) => (
            <li key={`${name}-${index}`}>{name}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/**
 * Streams in the student's funding status and year-wise sponsor history:
 * React suspends here until the sponsorships promise resolves, so the
 * profile header paints immediately.
 */
export function SponsorYearPanel({
  yearsPromise,
  student,
  signedIn,
}: SponsorYearPanelProps) {
  const years = use(yearsPromise);

  const currentYear = new Date().getFullYear();
  const receivedThisYear =
    years.find((y) => y.year === currentYear)?.received ?? 0;
  const funded = student.amount > 0 && receivedThisYear >= student.amount;

  return (
    <div className="flex flex-col gap-4">
      <FundingSummary
        student={student}
        receivedThisYear={receivedThisYear}
        funded={funded}
        signedIn={signedIn}
      />

      {years.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No sponsors yet — be the first to support {student.name}.
        </p>
      ) : (
        years.map((year) => <YearCard key={year.year} year={year} />)
      )}
    </div>
  );
}
