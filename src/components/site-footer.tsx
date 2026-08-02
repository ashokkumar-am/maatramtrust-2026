import Link from "next/link";
import { Heart, Mail, MapPin, Phone, Smartphone } from "lucide-react";
import { CONTACT, ORG, PROGRAMS } from "@/lib/site-content";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EXPLORE_LINKS = [
  { label: "Sponsor a Student", href: "/students" },
  { label: "Annadhana Sevai", href: "/annadhana" },
  { label: "Programs", href: "/programs" },
  { label: "Blog", href: "/blog" },
  { label: "About us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

/** Sitewide mega-footer: brand, explore links, programs, and contact. */
export function SiteFooter() {
  return (
    <footer className="border-t bg-zinc-950 text-zinc-300">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-semibold text-white">{ORG.shortName}</p>
            <p className="mt-1 text-sm text-zinc-400">{ORG.name}</p>
            <p className="mt-4 max-w-xs text-sm text-zinc-400">
              {ORG.tagline} Serving communities since {ORG.foundedLabel}.
            </p>
            <div className="mt-5 flex gap-3">
              {CONTACT.socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-400 underline-offset-4 hover:text-white hover:underline"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Explore">
            <ul className="space-y-2.5 text-sm">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-zinc-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterColumn>

          <FooterColumn title="Programs">
            <ul className="space-y-2.5 text-sm">
              {PROGRAMS.slice(0, 6).map((program) => (
                <li key={program.slug}>
                  <Link
                    href={program.href ?? "/programs"}
                    className="text-zinc-400 transition-colors hover:text-white"
                  >
                    {program.name}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterColumn>

          <FooterColumn title="Get in touch">
            <address className="space-y-3 text-sm text-zinc-400 not-italic">
              <p className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" />
                <a
                  href={CONTACT.phoneHref}
                  className="transition-colors hover:text-white"
                >
                  {CONTACT.phone}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Smartphone className="size-4 shrink-0" />
                <span>GPay: {CONTACT.gpay}</span>
              </p>
              {CONTACT.emails.map((email) => (
                <p key={email} className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0" />
                  <a
                    href={`mailto:${email}`}
                    className="transition-colors hover:text-white"
                  >
                    {email}
                  </a>
                </p>
              ))}
            </address>
            <Link
              href="/donate"
              className={cn(
                buttonVariants({ size: "sm" }),
                "mt-5 rounded-full",
              )}
            >
              <Heart className="size-3" />
              Donate now
            </Link>
          </FooterColumn>
        </div>

        <div className="mt-14 border-t border-zinc-800 pt-8">
          <div className="grid gap-8 text-sm text-zinc-400 sm:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-300 uppercase">
                Registered office address
              </p>
              <a
                href={CONTACT.mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex gap-2 transition-colors hover:text-white"
              >
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  {CONTACT.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </a>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-300 uppercase">
                Support
              </p>
              <p>
                Tel:{" "}
                <a
                  href={CONTACT.phoneHref}
                  className="transition-colors hover:text-white"
                >
                  {CONTACT.phone}
                </a>
              </p>
              <p className="mt-1">
                For queries write to:{" "}
                <a
                  href={`mailto:${CONTACT.emails[0]}`}
                  className="transition-colors hover:text-white"
                >
                  {CONTACT.emails[0]}
                </a>
              </p>
              <p className="mt-1">
                Need more information?{" "}
                <Link
                  href="/contact"
                  className="text-zinc-300 underline underline-offset-4 transition-colors hover:text-white"
                >
                  Contact us
                </Link>
                .
              </p>
            </div>
            <div className="sm:text-right">
              <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-300 uppercase">
                Follow us
              </p>
              <div className="flex gap-4 sm:justify-end">
                {CONTACT.socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-2 text-xs text-zinc-500 sm:flex-row">
            <p>
              © {new Date().getFullYear()} {ORG.name}. All rights reserved.
            </p>
            <p>Registered charitable trust · Chennai, Tamil Nadu</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
