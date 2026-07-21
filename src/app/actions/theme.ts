"use server";

import { cookies } from "next/headers";
import { DEFAULT_THEME, isTheme, THEME_COOKIE, type Theme } from "@/lib/theme";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Persist the user's theme preference in a cookie. Read back on the server in
 * the root layout so the correct theme is applied before first paint (no flash).
 */
export async function setTheme(theme: Theme) {
  const value: Theme = isTheme(theme) ? theme : DEFAULT_THEME;

  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE, value, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });

  return value;
}
