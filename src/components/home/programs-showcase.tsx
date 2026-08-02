import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PROGRAMS } from "@/lib/site-content";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { Card, CardContent } from "@/components/ui/card";

/** Grid of every program, staggering into view; each card links onward. */
export function ProgramsShowcase() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <FadeIn className="mb-12 max-w-2xl">
        <p className="text-primary text-sm font-medium tracking-widest uppercase">
          What we do
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Programs that change lives, every single day
        </h2>
        <p className="text-muted-foreground mt-4">
          From classrooms to clinics to community kitchens — here is where your
          support goes to work.
        </p>
      </FadeIn>

      <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PROGRAMS.map((program) => (
          <StaggerItem key={program.slug} className="h-full">
            <Link
              href={program.href ?? "/programs"}
              className="group block h-full"
            >
              <Card className="h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="bg-accent text-primary mb-4 flex size-11 items-center justify-center rounded-xl">
                    <program.icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{program.name}</h3>
                  <p className="text-primary mt-0.5 text-sm font-medium">
                    {program.tagline}
                  </p>
                  <p className="text-muted-foreground mt-3 flex-1 text-sm">
                    {program.description}
                  </p>
                  <span className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium">
                    {program.cta ?? "Learn more"}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
