import Link from "next/link";
import { auth } from "@/auth";
import { getAdminMetrics } from "@/lib/admin-metrics";
import { getAdminCharts } from "@/lib/admin-charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CommunityGrowthChart,
  MonthlyRaisedChart,
  SponsorshipsByYearChart,
} from "@/components/dashboard/overview-charts";

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

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const body = (
    <Card className="hover:border-foreground/20 h-full transition-colors">
      <CardContent className="p-4">
        <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export default async function DashboardPage() {
  const session = await auth();
  // The layout already guarantees a session; this narrows the type.
  const user = session!.user;
  const isAdmin = user.role === "admin";

  if (!isAdmin) {
    const isEditor = user.role === "editor";
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <Badge variant="secondary">{user.role}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Signed in as {user.name ?? user.email}.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/dashboard/my-giving" className="block">
            <Card className="hover:border-foreground/20 h-full transition-colors">
              <CardContent className="p-4">
                <h2 className="font-medium">My Giving</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Your donations (with receipts), sponsored students and
                  Annadhana Sevai bookings.
                </p>
              </CardContent>
            </Card>
          </Link>
          {isEditor && (
            <Link href="/dashboard/blog" className="block">
              <Card className="hover:border-foreground/20 h-full transition-colors">
                <CardContent className="p-4">
                  <h2 className="font-medium">Blog</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Write, edit and publish blog posts.
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>
    );
  }

  const [metrics, charts] = await Promise.all([
    getAdminMetrics(),
    getAdminCharts(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <Badge>admin</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="Total raised"
          value={formatCurrency(metrics.raisedTotal, metrics.currency)}
        />
        <StatCard
          label="Donations"
          value={formatCurrency(metrics.donationsTotal, metrics.currency)}
          href="/dashboard/donations"
        />
        <StatCard
          label="Sponsorships"
          value={formatCurrency(metrics.sponsorshipsTotal, metrics.currency)}
          href="/dashboard/students"
        />
        <StatCard
          label="Annadhana"
          value={formatCurrency(metrics.annadhanaTotal, metrics.currency)}
          href="/dashboard/annadhana"
        />
        <StatCard
          label="Students"
          value={metrics.students}
          href="/dashboard/students"
        />
        <StatCard
          label="Contacts"
          value={metrics.contacts}
          href="/dashboard/contacts"
        />
        <StatCard
          label="Subscribers"
          value={metrics.subscribers}
          href="/dashboard/newsletter"
        />
        <StatCard
          label="Categories"
          value={metrics.categories}
          href="/dashboard/categories"
        />
        <StatCard label="Posts" value={metrics.posts} href="/dashboard/blog" />
        <StatCard
          label="Banners"
          value={metrics.banners}
          href="/dashboard/banners"
        />
        <StatCard
          label="Documents"
          value={metrics.documents}
          href="/dashboard/documents"
        />
      </div>

      <MonthlyRaisedChart data={charts.monthlyRaised} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SponsorshipsByYearChart data={charts.sponsorshipsByYear} />
        <CommunityGrowthChart data={charts.monthlyCommunity} />
      </div>

      <p className="text-muted-foreground text-sm">
        Signed in as {user.name ?? user.email}. Use the menu to manage each
        resource.
      </p>
    </div>
  );
}
