import type { Metadata } from "next";
import { Geist_Mono, Nunito_Sans, Sora } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { AuthHeader } from "@/components/auth-header";
import { SiteFooter } from "@/components/site-footer";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { ThemeScript } from "@/components/theme-script";
import { DEFAULT_THEME, isTheme, THEME_COOKIE, type Theme } from "@/lib/theme";

// Body/UI face for paragraphs, forms, and navigation.
const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
});

// Display face for headings: geometric, carries the big hero type.
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maatram Trust",
  description:
    "Maatram Trust supports underprivileged students with education sponsorships, donations, and community initiatives.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieValue = (await cookies()).get(THEME_COOKIE)?.value;
  const theme: Theme = isTheme(cookieValue) ? cookieValue : DEFAULT_THEME;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        nunitoSans.variable,
        sora.variable,
        geistMono.variable,
        "font-sans",
        theme === "dark" && "dark",
      )}
    >
      <body className="flex min-h-full flex-col">
        <ThemeScript theme={theme} />
        <ServiceWorkerRegistration />
        <AuthHeader theme={theme} />
        {children}
        <SiteFooter />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
