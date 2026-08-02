import {
  Activity,
  Bike,
  Dog,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Home,
  Leaf,
  LifeBuoy,
  Sprout,
  UsersRound,
  UtensilsCrossed,
  Venus,
  type LucideIcon,
} from "lucide-react";

/**
 * Client-safe site content for the public pages — the single source of truth
 * for organization copy sourced from maatramtrust.org. No server imports.
 */

export const ORG = {
  name: "Maatram Educational and Charitable Trust",
  shortName: "Maatram",
  tagline: "Be the change. Change a life.",
  mission:
    "When you join our mission, you help us create a lasting impact — keeping deserving students in education, caring for families through free clinics, and feeding communities through Annadhana Sevai.",
  foundedYear: 2011,
  foundedLabel: "May 2011",
} as const;

/** Short proof points rotated along the hero's bottom edge. */
export const HERO_HIGHLIGHTS = [
  "Sponsor–student matching with full transparency",
  "Monthly free clinics since 2011",
  "Annadhana Sevai — meals served every day",
  "4,500+ volunteers across Tamil Nadu",
  "35 lakh+ lives touched",
  "Flood & disaster relief when it matters",
] as const;

export const CONTACT = {
  addressLines: [
    "Krashnika Nest, 5/528, Dr. Vaideki Road",
    "Venkatesha Puram, Kottivakkam",
    "Kannappa Nagar Extension, Thiruvanmiyur",
    "Chennai, Tamil Nadu 600041",
  ],
  phone: "095515 55550",
  phoneHref: "tel:+919551555550",
  gpay: "9884888088",
  emails: ["info@maatramtrust.org", "maatramtrust@gmail.com"],
  socials: [
    { label: "Facebook", href: "https://www.facebook.com/maatramtrust" },
    { label: "Instagram", href: "https://www.instagram.com/maatramtrust" },
  ],
  mapsHref:
    "https://www.google.com/maps/search/?api=1&query=Maatram+Educational+and+Charitable+Trust+Thiruvanmiyur+Chennai",
} as const;

export interface ImpactStat {
  value: number;
  suffix: string;
  label: string;
  detail: string;
}

/** Years in service, self-updating from the founding year. */
export function yearsOfService(): number {
  return new Date().getFullYear() - ORG.foundedYear;
}

export function impactStats(): ImpactStat[] {
  return [
    {
      value: yearsOfService(),
      suffix: "+",
      label: "Years of service",
      detail: `Serving communities since ${ORG.foundedLabel}`,
    },
    {
      value: 35,
      suffix: "L+",
      label: "Lives touched",
      detail: "Across education, health, and food programs",
    },
    {
      value: 4500,
      suffix: "+",
      label: "Volunteers",
      detail: "Standing with us across Tamil Nadu",
    },
  ];
}

export interface Program {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  /** Internal page when the program has one; otherwise the programs page. */
  href?: string;
  cta?: string;
}

export const PROGRAMS: Program[] = [
  {
    slug: "education",
    name: "Education",
    tagline: "Empowering education through financial support",
    description:
      "We keep deserving students in school and college by matching them with sponsors. Every rupee is recorded against a named student for the year, and sponsors can follow the journey with complete transparency.",
    icon: GraduationCap,
    href: "/students",
    cta: "Sponsor a student",
  },
  {
    slug: "annadhana-sevai",
    name: "Annadhana Sevai",
    tagline: "No one in our community goes hungry",
    description:
      "Our food donation program serves fresh meals on birthdays, memorials, and special occasions. Book a day, and we cook and serve on your behalf — with photos and updates from every serving.",
    icon: UtensilsCrossed,
    href: "/annadhana",
    cta: "Book an Annadhana",
  },
  {
    slug: "health",
    name: "Health & Free Clinic",
    tagline: "Financial support for health and wellness",
    description:
      "Running since May 2011, our monthly free clinic brings doctors and medicines to families who cannot afford essential care, alongside financial support for treatments and hospital stays.",
    icon: HeartPulse,
  },
  {
    slug: "women-empowerment",
    name: "Women Empowerment",
    tagline: "Investing in women's strength and success",
    description:
      "Skill development, self-defence training, and livelihood support that help women in our communities stand on their own — because empowering a woman uplifts an entire family.",
    icon: Venus,
  },
  {
    slug: "disaster-relief",
    name: "Natural Disaster Relief",
    tagline: "Supporting recovery from natural disasters",
    description:
      "When floods and cyclones strike Tamil Nadu, our volunteers mobilise food, shelter, and rebuilding support for affected families — from the 2015 Chennai floods to COVID-19 relief.",
    icon: LifeBuoy,
  },
  {
    slug: "environment-sports",
    name: "Environment, Sports & Self Defence",
    tagline: "Healthy communities, healthy planet",
    description:
      "Tree plantation drives, clean-up campaigns, and sports and self-defence coaching for young people — building confidence, fitness, and care for the environment.",
    icon: Leaf,
  },
  {
    slug: "elder-care",
    name: "Orphanage & Old Age Home Support",
    tagline: "Dignity at every age",
    description:
      "Regular provisions, celebrations, and companionship for children's homes and old age homes across Chennai — making sure no one is forgotten.",
    icon: Home,
  },
];

export interface UpcomingProject {
  name: string;
  description: string;
  icon: LucideIcon;
}

export const UPCOMING_PROJECTS: UpcomingProject[] = [
  {
    name: "Old age home & children's home",
    description: "A permanent home of our own for elders and children in need.",
    icon: Home,
  },
  {
    name: "Special child care",
    description: "Dedicated care and therapy support for special children.",
    icon: HandHeart,
  },
  {
    name: "Homes for Thirunangai",
    description: "Safe housing and livelihood support for the trans community.",
    icon: UsersRound,
  },
  {
    name: "Animal shelters",
    description: "Rescue, shelter, and care for street animals.",
    icon: Dog,
  },
  {
    name: "Farmer's support",
    description: "Backing small farmers with resources and fair market access.",
    icon: Sprout,
  },
];

export interface Value {
  name: string;
  description: string;
  icon: LucideIcon;
}

export const VALUES: Value[] = [
  {
    name: "Transparency",
    description:
      "Every sponsorship is recorded against a named student and year; our reports and tax filings are published for anyone to download.",
    icon: Activity,
  },
  {
    name: "Community first",
    description:
      "4,500+ volunteers plan and deliver every program hand-in-hand with the neighbourhoods we serve.",
    icon: UsersRound,
  },
  {
    name: "Dignity",
    description:
      "From free clinics to old age homes, we serve in ways that protect the self-respect of every person we reach.",
    icon: HandHeart,
  },
  {
    name: "Sustained support",
    description:
      "Monthly giving and year-long sponsorships mean our commitments don't end with a single donation.",
    icon: Bike,
  },
];
