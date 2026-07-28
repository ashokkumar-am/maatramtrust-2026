import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { AuthHeader } from "@/components/auth-header";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { ThemeScript } from "@/components/theme-script";
import { DEFAULT_THEME, isTheme, THEME_COOKIE, type Theme } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

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
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
        theme === "dark" && "dark",
      )}
    >
      <body className="flex min-h-full flex-col">
        <ThemeScript theme={theme} />
        <ServiceWorkerRegistration />
        <AuthHeader theme={theme} />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
