import Link from "next/link";
import { Heart } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Closing full-width call to action. */
export function FinalCta() {
  return (
    <section className="bg-emerald-950 text-white">
      <div className="mx-auto w-full max-w-4xl px-4 py-24 text-center sm:px-6">
        <FadeIn>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            When you join our mission, you help us create a lasting impact.
          </h2>
          <p className="mt-5 text-emerald-100/90">
            Every sponsorship, every meal, every clinic visit starts with one
            person deciding to help.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/donate"
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-full bg-white px-6 text-emerald-950 hover:bg-emerald-50",
              )}
            >
              <Heart className="size-4" />
              Donate now
            </Link>
            <Link
              href="/contact"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "rounded-full border-emerald-300/40 bg-transparent px-6 text-white hover:bg-emerald-900/60 hover:text-white",
              )}
            >
              Volunteer with us
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
