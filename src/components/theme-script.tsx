import type { Theme } from "@/lib/theme";

/**
 * Runs synchronously before first paint to resolve the "system" theme (and
 * reconcile any mismatch) so there is no flash of the wrong theme. Light/dark
 * are already applied server-side on <html>; this only needs to handle the
 * case where the resolved theme depends on the OS preference.
 */
export function ThemeScript({ theme }: { theme: Theme }) {
  const js = `(function(){try{var t=${JSON.stringify(theme)};var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
