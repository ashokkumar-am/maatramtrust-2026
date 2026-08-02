import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ORG, yearsOfService } from "@/lib/site-content";
import { FadeIn } from "@/components/motion/fade-in";

/** Who-we-are statement with an oversized pull quote, Ather-style. */
export function MissionSection() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[2fr_1fr] lg:gap-16">
      <FadeIn>
        <p className="text-primary text-sm font-medium tracking-widest uppercase">
          Who we are
        </p>
        <blockquote className="mt-4 text-2xl font-medium tracking-tight text-balance sm:text-4xl">
          &ldquo;Maatram&rdquo; means <em>change</em> — and for{" "}
          {yearsOfService()} years, change is what our volunteers have carried
          into classrooms, clinics, and community kitchens across Tamil Nadu.
        </blockquote>
      </FadeIn>

      <FadeIn delay={0.15} className="flex flex-col justify-end">
        <p className="text-muted-foreground text-sm">
          {ORG.name} was founded in {ORG.foundedLabel} with a simple belief: no
          deserving student should leave education for want of money, and no
          neighbour should go without care or a meal.
        </p>
        <Link
          href="/about"
          className="text-primary mt-5 inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Our story
          <ArrowRight className="size-3.5" />
        </Link>
      </FadeIn>
    </section>
  );
}
