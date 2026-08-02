"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  motion,
} from "framer-motion";

interface CountUpProps {
  /** Final value to count up to. */
  value: number;
  /** Rendered after the number, e.g. "+" or "L+". */
  suffix?: string;
  className?: string;
}

/**
 * Animates a number from 0 to `value` (Indian digit grouping) the first time
 * it scrolls into view. Respects prefers-reduced-motion (shows the final
 * value immediately).
 */
export function CountUp({ value, suffix = "", className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();

  const count = useMotionValue(reduceMotion ? value : 0);
  const rounded = useTransform(count, (latest) =>
    Math.round(latest).toLocaleString("en-IN"),
  );

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const controls = animate(count, value, { duration: 1.8, ease: "easeOut" });
    return () => controls.stop();
  }, [inView, reduceMotion, count, value]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}
