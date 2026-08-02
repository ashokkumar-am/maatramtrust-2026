import { Mail, MapPin, Phone, Smartphone } from "lucide-react";
import { CONTACT, ORG } from "@/lib/site-content";
import { ContactForm } from "@/components/contact/contact-form";
import { FadeIn } from "@/components/motion/fade-in";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Contact · Maatram",
  description:
    "Reach Maatram Educational and Charitable Trust — Chennai address, phone, email, and enquiry form.",
};

function InfoRow({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Mail;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="bg-accent text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <div className="text-muted-foreground mt-0.5 text-sm">{children}</div>
      </div>
    </div>
  );
}

function ContactDetails() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
        <InfoRow icon={MapPin} title="Visit us">
          <a
            href={CONTACT.mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground block"
          >
            {CONTACT.addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </a>
        </InfoRow>

        <InfoRow icon={Phone} title="Call us">
          <a href={CONTACT.phoneHref} className="hover:text-foreground">
            {CONTACT.phone}
          </a>
        </InfoRow>

        <InfoRow icon={Smartphone} title="GPay / UPI">
          {CONTACT.gpay} — PhonePe, Paytm &amp; Google Pay accepted
        </InfoRow>

        <InfoRow icon={Mail} title="Write to us">
          {CONTACT.emails.map((email) => (
            <a
              key={email}
              href={`mailto:${email}`}
              className="hover:text-foreground block"
            >
              {email}
            </a>
          ))}
        </InfoRow>

        <div className="border-t pt-5">
          <p className="text-sm font-medium">Follow our work</p>
          <div className="mt-2 flex gap-4">
            {CONTACT.socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm font-medium hover:underline"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6">
      <FadeIn className="mb-12 max-w-2xl">
        <p className="text-primary text-sm font-medium tracking-widest uppercase">
          Contact
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Talk to us — about giving, volunteering, or anything else
        </h1>
        <p className="text-muted-foreground mt-4">
          {ORG.name} is based in Thiruvanmiyur, Chennai. Whether you want to
          sponsor a student, book an Annadhana, or join our volunteers, we would
          love to hear from you.
        </p>
      </FadeIn>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <FadeIn delay={0.1}>
          <ContactDetails />
        </FadeIn>
        <FadeIn delay={0.2}>
          <h2 className="mb-4 text-xl font-semibold">Send us a message</h2>
          <ContactForm />
        </FadeIn>
      </div>
    </main>
  );
}
