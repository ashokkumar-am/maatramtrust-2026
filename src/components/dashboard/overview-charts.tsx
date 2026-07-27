"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type {
  MonthlyCommunityPoint,
  MonthlyRaisedPoint,
  YearlySponsorshipPoint,
} from "@/lib/admin-charts";

const inrCompact = (value: number) =>
  `₹${new Intl.NumberFormat("en-IN", { notation: "compact" }).format(value)}`;

const inrFull = (value: unknown) => `₹${Number(value).toLocaleString("en-IN")}`;

const raisedConfig = {
  donations: { label: "Donations", color: "var(--chart-2)" },
  sponsorships: { label: "Sponsorships", color: "var(--chart-3)" },
  annadhana: { label: "Annadhana", color: "var(--chart-4)" },
} satisfies ChartConfig;

const sponsorshipConfig = {
  pledged: { label: "Pledged", color: "var(--chart-3)" },
  received: { label: "Received", color: "var(--chart-2)" },
} satisfies ChartConfig;

const communityConfig = {
  contacts: { label: "Contacts", color: "var(--chart-2)" },
  subscribers: { label: "Subscribers", color: "var(--chart-3)" },
} satisfies ChartConfig;

function MoneyTooltip() {
  return (
    <ChartTooltipContent
      formatter={(value, name, item) => (
        <>
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: item.color }}
          />
          <div className="flex flex-1 items-center justify-between gap-3 leading-none">
            <span className="text-muted-foreground">
              {raisedConfig[name as keyof typeof raisedConfig]?.label ??
                sponsorshipConfig[name as keyof typeof sponsorshipConfig]
                  ?.label ??
                name}
            </span>
            <span className="text-foreground font-mono font-medium tabular-nums">
              {inrFull(value)}
            </span>
          </div>
        </>
      )}
    />
  );
}

/** Money raised per month (last 12 months), stacked by source. */
export function MonthlyRaisedChart({ data }: { data: MonthlyRaisedPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Money raised</CardTitle>
        <CardDescription>
          Donations, sponsorships and annadhana received — last 12 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={raisedConfig} className="h-64 w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              width={56}
              tickFormatter={inrCompact}
            />
            <ChartTooltip content={<MoneyTooltip />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="donations"
              stackId="raised"
              fill="var(--color-donations)"
            />
            <Bar
              dataKey="sponsorships"
              stackId="raised"
              fill="var(--color-sponsorships)"
            />
            <Bar
              dataKey="annadhana"
              stackId="raised"
              fill="var(--color-annadhana)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/** Student sponsorships pledged vs received, per academic year. */
export function SponsorshipsByYearChart({
  data,
}: {
  data: YearlySponsorshipPoint[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sponsorships by year</CardTitle>
        <CardDescription>Pledged vs received, per year</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={sponsorshipConfig} className="h-64 w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="year"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              width={56}
              tickFormatter={inrCompact}
            />
            <ChartTooltip content={<MoneyTooltip />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="pledged"
              fill="var(--color-pledged)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="received"
              fill="var(--color-received)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/** New contacts and newsletter subscribers per month (last 12 months). */
export function CommunityGrowthChart({
  data,
}: {
  data: MonthlyCommunityPoint[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Community growth</CardTitle>
        <CardDescription>
          New contacts and subscribers — last 12 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={communityConfig} className="h-64 w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              width={32}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="contacts"
              fill="var(--color-contacts)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="subscribers"
              fill="var(--color-subscribers)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
