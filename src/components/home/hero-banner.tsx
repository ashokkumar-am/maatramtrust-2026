"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { BannerView } from "@/lib/banners";

const ROTATE_MS = 6000;

export function HeroBanner({ banners }: { banners: BannerView[] }) {
  const [index, setIndex] = useState(0);
  const count = banners.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => go(index + 1), ROTATE_MS);
    return () => clearInterval(timer);
  }, [index, count, go]);

  if (count === 0) return null;

  const active = banners[index];

  return (
    <section
      aria-label="Highlights"
      aria-roledescription="carousel"
      className="relative h-[60vh] max-h-[640px] min-h-[320px] w-full overflow-hidden bg-black"
    >
      {banners.map((banner, i) => (
        <BannerSlide key={banner.id} banner={banner} active={i === index} />
      ))}

      {(active.title || active.caption) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 sm:p-10">
          <div className="mx-auto max-w-5xl text-white">
            {active.title && (
              <h2 className="text-2xl font-semibold tracking-tight sm:text-4xl">
                {active.title}
              </h2>
            )}
            {active.caption && (
              <p className="mt-2 max-w-xl text-sm text-zinc-200 sm:text-base">
                {active.caption}
              </p>
            )}
          </div>
        </div>
      )}

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
            className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(index + 1)}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-2">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function BannerSlide({
  banner,
  active,
}: {
  banner: BannerView;
  active: boolean;
}) {
  const media =
    banner.mediaType === "video" ? (
      <video
        className="h-full w-full object-cover"
        src={banner.url}
        autoPlay
        muted
        loop
        playsInline
        aria-label={banner.alt ?? banner.title ?? "Banner video"}
      />
    ) : (
      <Image
        className="object-cover"
        src={banner.url}
        alt={banner.alt ?? banner.title ?? "Banner"}
        fill
        sizes="100vw"
        priority={active}
      />
    );

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-700 ${
        active ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!active}
    >
      {banner.link ? (
        <Link href={banner.link} className="block h-full w-full">
          {media}
        </Link>
      ) : (
        media
      )}
    </div>
  );
}
