import { formatDistanceToNow } from "date-fns";
import { HeartHandshake } from "lucide-react";
import type { PublicDonation } from "@/lib/donations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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

/**
 * Public donor wall for the homepage: recent supporters with masked names, the
 * category they gave to, the amount, and how long ago. Renders nothing when
 * there are no donations yet.
 */
export function RecentDonations({
  donations,
}: {
  donations: PublicDonation[];
}) {
  if (donations.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mb-6 flex items-center gap-2">
        <HeartHandshake className="size-5 text-[#0a7d3e]" />
        <h2 className="text-xl font-semibold tracking-tight">
          Recent supporters
        </h2>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {donations.map((donation) => (
          <li key={donation.id}>
            <Card className="h-full">
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{donation.name}</span>
                  <span className="font-semibold whitespace-nowrap text-[#0a7d3e]">
                    {formatCurrency(donation.amount, donation.currency)}
                  </span>
                </div>
                <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
                  {donation.category ? (
                    <Badge variant="secondary">{donation.category}</Badge>
                  ) : (
                    <span />
                  )}
                  <time dateTime={new Date(donation.at).toISOString()}>
                    {formatDistanceToNow(new Date(donation.at), {
                      addSuffix: true,
                    })}
                  </time>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
