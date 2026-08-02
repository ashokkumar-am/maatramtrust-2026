import type { StudentView } from "@/lib/student-view";

/**
 * Confirmed sponsor names for a student, grouped by year (newest first).
 * Renders nothing when the student has no confirmed sponsors yet.
 */
export function SponsorHistory({
  sponsorsByYear,
}: {
  sponsorsByYear: StudentView["sponsorsByYear"];
}) {
  if (sponsorsByYear.length === 0) return null;

  return (
    <div className="border-t pt-3">
      <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
        Sponsors
      </p>
      <ul className="space-y-0.5 text-sm">
        {sponsorsByYear.map((entry) => (
          <li key={entry.year}>
            <span className="font-medium">{entry.year}:</span>{" "}
            {entry.names.join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
