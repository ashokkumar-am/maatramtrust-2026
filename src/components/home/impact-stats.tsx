import { impactStats } from "@/lib/site-content";
import { CountUp } from "@/components/motion/count-up";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";

/** Big-number impact strip with animated counters. */
export function ImpactStats() {
  return (
    <section aria-label="Our impact" className="border-y">
      <StaggerContainer className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:grid-cols-3 sm:px-6">
        {impactStats().map((stat) => (
          <StaggerItem key={stat.label} className="text-center sm:text-left">
            <p className="text-primary text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
              <CountUp value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-2 text-lg font-medium">{stat.label}</p>
            <p className="text-muted-foreground mt-1 text-sm">{stat.detail}</p>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
