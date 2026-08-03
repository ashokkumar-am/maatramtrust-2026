/**
 * Same-site path guard for post-auth redirects: only relative paths are
 * honoured ("//evil.com" parses as protocol-relative, absolute URLs are
 * rejected), so a crafted link can't bounce a sign-in to another origin.
 */
export function safeCallbackUrl(
  url: string | null | undefined,
  fallback = "/",
): string {
  return url?.startsWith("/") && !url.startsWith("//") ? url : fallback;
}
