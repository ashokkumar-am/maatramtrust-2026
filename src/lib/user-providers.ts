/**
 * Display names for OAuth sign-in providers, keyed by the Auth.js provider id
 * stored on `accounts.provider`. Client-safe (no env access) so admin UI can
 * render provider badges. When a new provider is wired into `src/auth.ts`
 * (Facebook, Twitter/X, Instagram, …), add its label here — unknown ids still
 * render via the capitalized-id fallback, so this never blocks a login.
 */
const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  twitter: "Twitter / X",
  instagram: "Instagram",
};

/** Human-readable label for a provider id (falls back to a capitalized id). */
export function providerLabel(providerId: string): string {
  return (
    PROVIDER_LABELS[providerId] ??
    providerId.charAt(0).toUpperCase() + providerId.slice(1)
  );
}
