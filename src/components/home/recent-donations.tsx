"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { HeartHandshake } from "lucide-react";
import type { PublicDonation } from "@/lib/donations";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

const monthKey = (at: PublicDonation["at"]) => format(new Date(at), "yyyy-MM");

const monthLabel = (key: string) =>
  format(new Date(`${key}-01T00:00:00`), "MMM yyyy");

const chip = (active: boolean) =>
  cn(
    "rounded-full border px-3 py-1 text-sm transition-colors",
    active
      ? "border-transparent bg-primary text-primary-foreground"
      : "text-muted-foreground hover:text-foreground hover:border-foreground/30",
  );

/**
 * Public donor wall: recent supporters as a list with a month filter.
 * Names arrive masked from the server; renders nothing with no donations.
 */
export function RecentDonations({
  donations,
}: {
  donations: PublicDonation[];
}) {
  const [month, setMonth] = useState<string>("all");

  const months = useMemo(
    () => [...new Set(donations.map((donation) => monthKey(donation.at)))],
    [donations],
  );
  const visible =
    month === "all"
      ? donations
      : donations.filter((donation) => monthKey(donation.at) === month);

  if (donations.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <FadeIn>
        <div className="flex items-center gap-2">
          <HeartHandshake className="text-primary size-5" />
          <h2 className="text-3xl font-semibold tracking-tight">
            Recent supporters
          </h2>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Real people, giving in real time.
        </p>

        {months.length > 1 && (
          <nav
            aria-label="Filter supporters by month"
            className="mt-5 flex flex-wrap gap-2"
          >
            <button
              type="button"
              onClick={() => setMonth("all")}
              className={chip(month === "all")}
            >
              All
            </button>
            {months.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setMonth(key)}
                className={chip(month === key)}
              >
                {monthLabel(key)}
              </button>
            ))}
          </nav>
        )}

        <ul className="mt-6 divide-y rounded-2xl border">
          {visible.map((donation) => (
            <li
              key={donation.id}
              className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{donation.name}</p>
                <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
                  {donation.category && (
                    <Badge variant="secondary">{donation.category}</Badge>
                  )}
                  <time dateTime={new Date(donation.at).toISOString()}>
                    {format(new Date(donation.at), "dd MMM yyyy")}
                  </time>
                </div>
              </div>
              <span className="text-primary font-semibold whitespace-nowrap tabular-nums">
                {formatCurrency(donation.amount, donation.currency)}
              </span>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="text-muted-foreground px-4 py-6 text-sm">
              No donations in {monthLabel(month)} yet.
            </li>
          )}
        </ul>
      </FadeIn>
    </section>
  );
}
