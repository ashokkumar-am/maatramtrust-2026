"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import { HERO_HIGHLIGHTS } from "@/lib/site-content";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const entrance = (reduced: boolean, delay: number) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.7,
          delay,
          ease: [0.21, 0.47, 0.32, 0.98] as const,
        },
      };

/**
 * Full-bleed cinematic hero: huge centered headline with a highlighted word,
 * pill CTA pair, and a proof-point ticker along the bottom edge. Uses the
 * first admin banner image as the backdrop when available, else a deep
 * emerald gradient.
 */
export function HomeHero({ backgroundUrl }: { backgroundUrl?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate flex min-h-[85svh] flex-col overflow-hidden bg-emerald-950 text-white">
      {backgroundUrl ? (
        <>
          <Image
            src={backgroundUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/40 to-black/30"
          />
        </>
      ) : (
        <>
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(80rem_40rem_at_70%_-10%,rgba(16,185,129,0.35),transparent),radial-gradient(50rem_30rem_at_10%_110%,rgba(5,150,105,0.25),transparent)]"
          />
          <motion.div
            aria-hidden
            className="absolute -top-32 right-[-10%] -z-10 size-[36rem] rounded-full bg-emerald-500/20 blur-3xl"
            animate={
              reduceMotion ? undefined : { y: [0, 24, 0], x: [0, -16, 0] }
            }
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
        <motion.h1
          className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl"
          {...entrance(Boolean(reduceMotion), 0.05)}
        >
          It&rsquo;s easy to{" "}
          <span className="inline-block rounded-full border-2 border-yellow-300/90 px-4 pb-1 sm:border-[3px] sm:px-6">
            change
          </span>{" "}
          a life.
        </motion.h1>

        <motion.p
          className="mt-6 max-w-2xl text-base text-white/85 sm:text-lg"
          {...entrance(Boolean(reduceMotion), 0.18)}
        >
          Keep a student in education, serve a day of meals, fund a clinic visit
          — Maatram turns your giving into change you can see.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
          {...entrance(Boolean(reduceMotion), 0.3)}
        >
          <Link
            href="/students"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-full bg-white px-6 text-emerald-950 hover:bg-emerald-50",
            )}
          >
            Sponsor a student
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/donate"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-full bg-emerald-900/80 px-6 text-white ring-1 ring-white/25 hover:bg-emerald-900",
            )}
          >
            <Heart className="size-4" />
            Donate now
          </Link>
        </motion.div>
      </div>

      <motion.ul
        aria-label="Why give through Maatram"
        className="mx-auto flex w-full max-w-6xl gap-8 overflow-x-auto px-4 pb-6 text-sm whitespace-nowrap text-white/80 sm:px-6 sm:text-[0.9rem] [&::-webkit-scrollbar]:hidden"
        {...entrance(Boolean(reduceMotion), 0.45)}
      >
        {HERO_HIGHLIGHTS.map((highlight) => (
          <li key={highlight} className="shrink-0">
            {highlight}
          </li>
        ))}
      </motion.ul>
    </section>
  );
}
