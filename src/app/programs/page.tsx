import Link from "next/link";
import { ArrowRight, Hammer } from "lucide-react";
import { PROGRAMS, UPCOMING_PROJECTS } from "@/lib/site-content";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Programs · Maatram",
  description:
    "Education sponsorships, Annadhana Sevai, free clinics, women empowerment, disaster relief and more — the programs of Maatram Trust.",
};

function ProgramPanel({
  program,
  index,
}: {
  program: (typeof PROGRAMS)[number];
  index: number;
}) {
  const reversed = index % 2 === 1;

  return (
    <FadeIn>
      <article
        className={cn(
          "grid items-center gap-8 lg:grid-cols-2 lg:gap-16",
          reversed && "lg:[direction:rtl]",
        )}
      >
        <div
          className={cn(
            "bg-accent flex aspect-[4/3] items-center justify-center rounded-3xl",
            "lg:[direction:ltr]",
          )}
        >
          <program.icon className="text-primary size-24" strokeWidth={1.2} />
        </div>

        <div className="lg:[direction:ltr]">
          <p className="text-primary text-sm font-medium tracking-widest uppercase">
            {program.tagline}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {program.name}
          </h2>
          <p className="text-muted-foreground mt-4">{program.description}</p>
          {program.href && (
            <Link
              href={program.href}
              className={cn(buttonVariants({ size: "sm" }), "mt-6")}
            >
              {program.cta ?? "Learn more"}
              <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      </article>
    </FadeIn>
  );
}

function UpcomingProjects() {
  return (
    <section className="bg-muted/50">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <FadeIn className="mb-10 max-w-2xl">
          <div className="flex items-center gap-2">
            <Hammer className="text-primary size-5" />
            <Badge variant="secondary">In development</Badge>
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            What we&apos;re building next
          </h2>
          <p className="text-muted-foreground mt-3 text-sm">
            Five new fronts we are preparing to open — support today helps us
            get there sooner.
          </p>
        </FadeIn>

        <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {UPCOMING_PROJECTS.map((project) => (
            <StaggerItem key={project.name}>
              <div className="bg-background h-full rounded-2xl border p-6">
                <project.icon className="text-primary size-6" />
                <h3 className="mt-4 font-semibold">{project.name}</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  {project.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

export default function ProgramsPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-8 sm:px-6">
        <FadeIn className="max-w-3xl">
          <p className="text-primary text-sm font-medium tracking-widest uppercase">
            Programs
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Everywhere our community needs us
          </h1>
          <p className="text-muted-foreground mt-5">
            Seven active programs, one purpose: lasting change for the people of
            Tamil Nadu.
          </p>
        </FadeIn>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 py-12 sm:px-6">
        {PROGRAMS.map((program, index) => (
          <ProgramPanel key={program.slug} program={program} index={index} />
        ))}
      </section>

      <UpcomingProjects />

      <section className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6">
        <FadeIn>
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Every program runs on people like you
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/donate" className={cn(buttonVariants({ size: "lg" }))}>
              Donate now
            </Link>
            <Link
              href="/contact"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              Volunteer with us
            </Link>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
