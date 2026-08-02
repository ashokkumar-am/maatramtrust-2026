import { Eye, Target } from "lucide-react";
import { getPublicDocumentGroups } from "@/lib/documents";
import { ORG, PROGRAMS, VALUES, yearsOfService } from "@/lib/site-content";
import { DocumentDownloads } from "@/components/documents/document-downloads";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "About · Maatram",
  description:
    "The story of Maatram Educational and Charitable Trust — our mission, values, and published reports.",
};

const FOCUS_AREAS = [
  ...PROGRAMS.map((program) => program.name),
  "Animal Rescue",
  "COVID-19 Support",
  "Special Events",
];

function StorySection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-20 sm:px-6">
      <FadeIn className="max-w-3xl">
        <p className="text-primary text-sm font-medium tracking-widest uppercase">
          Our story
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {yearsOfService()} years of turning compassion into change
        </h1>
        <div className="text-muted-foreground mt-6 space-y-4">
          <p>
            {ORG.name} began in {ORG.foundedLabel} with two commitments: a free
            clinic so no family in our neighbourhood would go without care, and
            education support so no deserving student would drop out for want of
            fees.
          </p>
          <p>
            Today, more than 4,500 volunteers carry that work across Tamil Nadu
            — sponsoring students through school and college, serving meals
            through Annadhana Sevai, standing with families after floods and
            cyclones, and reaching over 35 lakh lives along the way.
          </p>
          <p>
            &ldquo;Maatram&rdquo; means <em>change</em>. We measure ours one
            student, one meal, one clinic visit at a time.
          </p>
        </div>
      </FadeIn>
    </section>
  );
}

function MissionVision() {
  return (
    <section className="bg-muted/50">
      <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <FadeIn className="h-full">
          <Card className="h-full">
            <CardContent className="p-8">
              <Target className="text-primary size-8" />
              <h2 className="mt-4 text-xl font-semibold">Our mission</h2>
              <p className="text-muted-foreground mt-3">{ORG.mission}</p>
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.12} className="h-full">
          <Card className="h-full">
            <CardContent className="p-8">
              <Eye className="text-primary size-8" />
              <h2 className="mt-4 text-xl font-semibold">Our vision</h2>
              <p className="text-muted-foreground mt-3">
                A Tamil Nadu where every child completes their education, every
                family can reach a doctor, and every community has the strength
                to lift its most vulnerable — with transparency at the heart of
                every rupee given.
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </section>
  );
}

function ValuesSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <FadeIn className="mb-10">
        <h2 className="text-3xl font-semibold tracking-tight">
          What we stand for
        </h2>
      </FadeIn>
      <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {VALUES.map((value) => (
          <StaggerItem key={value.name}>
            <div className="h-full rounded-2xl border p-6">
              <value.icon className="text-primary size-6" />
              <h3 className="mt-4 font-semibold">{value.name}</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                {value.description}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <FadeIn className="mt-12">
        <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
          Where we work
        </h3>
        <div className="flex flex-wrap gap-2">
          {FOCUS_AREAS.map((area) => (
            <Badge key={area} variant="secondary">
              {area}
            </Badge>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}

export default async function AboutPage() {
  const groups = await getPublicDocumentGroups();

  return (
    <main className="flex-1">
      <StorySection />
      <MissionVision />
      <ValuesSection />

      <section aria-labelledby="documents-heading" className="border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <FadeIn className="mb-8 max-w-2xl">
            <h2
              id="documents-heading"
              className="text-3xl font-semibold tracking-tight"
            >
              Reports &amp; documents
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              In the interest of transparency, we publish our annual reports and
              tax filings for anyone to download.
            </p>
          </FadeIn>
          <DocumentDownloads groups={groups} />
        </div>
      </section>
    </main>
  );
}
