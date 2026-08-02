import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { CONTACT } from "@/lib/site-content";
import { FadeIn } from "@/components/motion/fade-in";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FamilyCard {
  title: string;
  chip: string;
  description: string;
  note: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  className: string;
}

const CARDS: FamilyCard[] = [
  {
    title: "Sponsor a Student",
    chip: "Made for their future",
    description:
      "Match with a named student and fund their year of education — school fees, books, and college support.",
    note: "Every rupee recorded against your student, transparently",
    primary: { label: "Meet the students", href: "/students" },
    secondary: { label: "How it works", href: "/programs" },
    className:
      "bg-[radial-gradient(60rem_30rem_at_80%_-20%,rgba(16,185,129,0.5),transparent)] bg-emerald-950",
  },
  {
    title: "Annadhana Sevai",
    chip: "Made for memories",
    description:
      "Mark a birthday or honour a memory by serving fresh meals to the community — we cook and serve on your behalf.",
    note: "Photos and updates shared from every serving",
    primary: { label: "Book an Annadhana", href: "/annadhana" },
    secondary: { label: "See past servings", href: "/annadhana" },
    className:
      "bg-[radial-gradient(60rem_30rem_at_20%_-20%,rgba(217,119,6,0.45),transparent)] bg-stone-900",
  },
];

/**
 * "The Maatram Giving Family": two tall feature panels with centered titles
 * and pill CTA pairs, plus a direct-giving strip beneath.
 */
export function WaysToGive() {
  return (
    <section aria-label="Ways to give" className="bg-muted/50">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <FadeIn className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            The Maatram giving family
          </h2>
        </FadeIn>

        <div className="grid gap-6 lg:grid-cols-2">
          {CARDS.map((card, index) => (
            <FadeIn key={card.title} delay={index * 0.12} className="h-full">
              <article
                className={cn(
                  "flex h-full min-h-[26rem] flex-col items-center justify-between rounded-3xl p-8 text-center text-white sm:min-h-[30rem] sm:p-10",
                  card.className,
                )}
              >
                <div className="flex flex-col items-center">
                  <h3 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {card.title}
                  </h3>
                  <span className="mt-3 rounded-full bg-white/15 px-4 py-1 text-sm backdrop-blur">
                    {card.chip}
                  </span>
                  <p className="mt-6 max-w-md text-sm text-white/85 sm:text-base">
                    {card.description}
                  </p>
                </div>

                <div className="mt-10 flex flex-col items-center gap-4">
                  <p className="text-sm text-white/75">{card.note}</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link
                      href={card.primary.href}
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "rounded-full bg-white px-6 text-zinc-950 hover:bg-zinc-100",
                      )}
                    >
                      {card.primary.label}
                    </Link>
                    <Link
                      href={card.secondary.href}
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "rounded-full bg-white/10 px-6 text-white ring-1 ring-white/30 hover:bg-white/20",
                      )}
                    >
                      {card.secondary.label}
                    </Link>
                  </div>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.2}>
          <div className="bg-background mt-6 flex flex-col items-center justify-between gap-4 rounded-3xl border p-6 sm:flex-row sm:p-8">
            <div>
              <h3 className="text-lg font-semibold">Give what you can</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                One-time or monthly, online in seconds — or GPay the trust
                directly at{" "}
                <span className="text-foreground font-medium">
                  {CONTACT.gpay}
                </span>
                . PhonePe, Paytm &amp; Google Pay accepted.
              </p>
            </div>
            <Link
              href="/donate"
              className={cn(
                buttonVariants({ size: "lg" }),
                "shrink-0 rounded-full px-6",
              )}
            >
              <Heart className="size-4" />
              Donate now
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
