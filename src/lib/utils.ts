import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Re-parse the date part of an ISO string as *local* midnight. Day-valued
 * fields are stored at UTC midnight; formatting those instants directly
 * renders the previous day for viewers west of UTC. Formatting this local
 * reconstruction shows the intended calendar day in every timezone.
 */
export function toLocalDay(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00`);
}
