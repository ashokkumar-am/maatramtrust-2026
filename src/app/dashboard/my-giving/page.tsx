import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { auth } from "@/auth";
import { getMyDonations, type MyDonation } from "@/lib/donations";
import { getMySponsorships } from "@/lib/sponsorships";
import { getMyAnnadhanaBookings } from "@/lib/annadhana";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "My Giving · Maatram" };

function formatAmount(amount: number, currency: string): string {
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

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "captured" || status === "received"
      ? ("secondary" as const)
      : status === "failed" || status === "refunded"
        ? ("destructive" as const)
        : ("outline" as const);
  return <Badge variant={variant}>{status}</Badge>;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="font-medium">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="overflow-x-auto rounded-lg border">{children}</div>
    </section>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  );
}

function ReceiptCell({ donation }: { donation: MyDonation }) {
  if (!donation.receiptAvailable) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <a
      href={`/api/me/donations/${donation.id}/receipt`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
    >
      <Download className="size-3" />
      Receipt
    </a>
  );
}

/**
 * Donor self-service: the signed-in user's donations (with receipt
 * downloads), sponsored students and Annadhana Sevai bookings. Available to
 * every registered account regardless of role.
 */
export default async function MyGivingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fdashboard%2Fmy-giving");
  }

  const owner = { userId: session.user.id, email: session.user.email };
  const [donations, sponsorships, bookings] = await Promise.all([
    getMyDonations(owner),
    getMySponsorships(owner),
    getMyAnnadhanaBookings(owner),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">My Giving</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your donations, sponsored students and Annadhana Sevai bookings.
          Receipts for completed donations can be downloaded anytime; the
          statutory 80G certificate is coming soon.
        </p>
      </header>

      <Section
        title="Donations"
        description="General donations, with downloadable receipts."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Receipt No.</TableHead>
              <TableHead className="text-right">Download</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.length === 0 ? (
              <EmptyRow colSpan={6} label="No donations yet." />
            ) : (
              donations.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(d.at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>{d.category ?? "General"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatAmount(d.amount, d.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={d.status} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {d.receiptNumber ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <ReceiptCell donation={d} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>

      <Section
        title="Sponsored students"
        description="Your student sponsorships, tracked per academic year."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sponsorships.length === 0 ? (
              <EmptyRow colSpan={5} label="No sponsorships yet." />
            ) : (
              sponsorships.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.studentName ?? "—"}
                  </TableCell>
                  <TableCell>{s.year}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatAmount(
                      s.status === "received" ? s.receivedAmt : s.amount,
                      s.currency,
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {format(new Date(s.at), "dd MMM yyyy")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>

      <Section
        title="Annadhana Sevai"
        description="Your bookings, with the occasion they were made for."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event date</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <EmptyRow colSpan={5} label="No bookings yet." />
            ) : (
              bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(b.eventDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{b.occasion}</span>
                    {b.honoreeName ? ` · ${b.honoreeName}` : null}
                    {b.occasionDetail ? (
                      <span className="text-muted-foreground">
                        {" "}
                        ({b.occasionDetail})
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>{b.campaignTitle ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatAmount(
                      b.status === "received" ? b.receivedAmt : b.amount,
                      b.currency,
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>
    </div>
  );
}
