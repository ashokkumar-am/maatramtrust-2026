import Link from "next/link";
import { format } from "date-fns";
import type { UpdateArchiveYear } from "@/lib/annadhana";
import { cn } from "@/lib/utils";

const chip = (active: boolean) =>
  cn(
    "rounded-full border px-3 py-1 text-sm transition-colors",
    active
      ? "border-transparent bg-primary text-primary-foreground"
      : "text-muted-foreground hover:text-foreground hover:border-foreground/30",
  );

/**
 * Year → month filter for the campaign feed. Plain links (`?year=&month=`)
 * so the filtered feed is fully server-rendered and shareable.
 */
export function FeedArchive({
  archive,
  basePath,
  year,
  month,
}: {
  archive: UpdateArchiveYear[];
  basePath: string;
  year?: number;
  month?: number;
}) {
  // A filter is only useful once the feed spans more than one month.
  const monthCount = archive.reduce((sum, y) => sum + y.months.length, 0);
  if (monthCount <= 1) return null;

  return (
    <nav aria-label="Browse updates by period" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={basePath} className={chip(!year)}>
          All updates
        </Link>
        {archive.map((entry) => (
          <Link
            key={entry.year}
            href={`${basePath}?year=${entry.year}`}
            className={chip(year === entry.year && !month)}
          >
            {entry.year}
          </Link>
        ))}
      </div>

      {year && (
        <div className="flex flex-wrap items-center gap-2">
          {archive
            .find((entry) => entry.year === year)
            ?.months.map(({ month: m, count }) => (
              <Link
                key={m}
                href={`${basePath}?year=${year}&month=${m}`}
                className={chip(month === m)}
              >
                {format(new Date(Date.UTC(year, m - 1, 1)), "MMM")}
                <span className="text-muted-foreground/80 ml-1 text-xs">
                  {count}
                </span>
              </Link>
            ))}
        </div>
      )}
    </nav>
  );
}
