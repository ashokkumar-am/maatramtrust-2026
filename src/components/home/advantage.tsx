import { VALUES } from "@/lib/site-content";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { Badge } from "@/components/ui/badge";

/**
 * "The Maatram Advantage": centered chip + oversized heading with a row of
 * four tall gradient cards, text pinned to the bottom edge.
 */
export function Advantage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <FadeIn className="mb-12 text-center">
        <Badge variant="secondary" className="rounded-full px-4 py-1">
          The Maatram Advantage
        </Badge>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          Effortless giving.
          <br />
          Worry-free impact.
        </h2>
      </FadeIn>

      <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {VALUES.map((value) => (
          <StaggerItem key={value.name} className="h-full">
            <article className="relative flex h-full min-h-[22rem] flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-800 to-emerald-950 p-6 text-white">
              <value.icon
                aria-hidden
                className="absolute top-6 left-6 size-10 text-emerald-300/90"
                strokeWidth={1.5}
              />
              <h3 className="text-xl font-semibold">{value.name}</h3>
              <p className="mt-2 text-sm text-white/80">{value.description}</p>
            </article>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
