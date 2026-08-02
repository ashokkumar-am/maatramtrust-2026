import { format } from "date-fns";
import { CalendarHeart } from "lucide-react";
import type { UpcomingDay } from "@/lib/annadhana";
import { occasionPhrase } from "@/components/annadhana/occasion";
import { toLocalDay } from "@/lib/utils";

/**
 * Future days already sponsored for a campaign — the "coming up" board shown
 * above the daily photo feed. Renders nothing when no future day is booked.
 */
export function UpcomingDays({ days }: { days: UpcomingDay[] }) {
  if (days.length === 0) return null;

  return (
    <section aria-labelledby="upcoming-days" className="mb-10">
      <h2 id="upcoming-days" className="text-lg font-medium">
        Upcoming sponsored days
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        These mornings are already taken care of — photos will appear in the
        feed after each serving.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((day) => (
          <li
            key={day.date}
            className="flex items-start gap-3 rounded-xl border p-4"
          >
            <div className="bg-accent text-primary flex size-11 shrink-0 flex-col items-center justify-center rounded-lg">
              <span className="text-sm font-semibold">
                {format(toLocalDay(day.date), "dd")}
              </span>
              <span className="text-[10px] font-medium uppercase">
                {format(toLocalDay(day.date), "MMM")}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {format(toLocalDay(day.date), "EEEE, dd MMM yyyy")}
              </p>
              {day.sponsors.map((sponsor, index) => (
                <p
                  key={`${sponsor.donorName ?? "friend"}-${index}`}
                  className="text-muted-foreground mt-0.5 flex items-start gap-1.5 text-sm"
                >
                  <CalendarHeart className="text-primary mt-0.5 size-3.5 shrink-0" />
                  <span>
                    Sponsored by{" "}
                    <strong className="text-foreground">
                      {sponsor.donorName ?? "a kind friend"}
                    </strong>{" "}
                    marking {occasionPhrase(sponsor)}.
                  </span>
                </p>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
