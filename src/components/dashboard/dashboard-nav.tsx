"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  HandCoins,
  HeartHandshake,
  Images,
  Inbox,
  LayoutDashboard,
  Mail,
  Newspaper,
  Tags,
  UserCog,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/roles";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const OVERVIEW: NavLink = {
  href: "/dashboard",
  label: "Overview",
  icon: LayoutDashboard,
  exact: true,
};

/** Every signed-in user's own giving (donations, sponsorships, annadhana). */
const MY_GIVING: NavLink = {
  href: "/dashboard/my-giving",
  label: "My Giving",
  icon: HeartHandshake,
};

const BLOG: NavLink = {
  href: "/dashboard/blog",
  label: "Blog",
  icon: Newspaper,
};

const ADMIN_LINKS: NavLink[] = [
  OVERVIEW,
  { href: "/dashboard/donations", label: "Donations", icon: HandCoins },
  { href: "/dashboard/annadhana", label: "Annadhana", icon: UtensilsCrossed },
  { href: "/dashboard/students", label: "Students", icon: Users },
  { href: "/dashboard/contacts", label: "Contacts", icon: Inbox },
  { href: "/dashboard/newsletter", label: "Newsletter", icon: Mail },
  { href: "/dashboard/categories", label: "Categories", icon: Tags },
  BLOG,
  { href: "/dashboard/banners", label: "Banners", icon: Images },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/users", label: "Users", icon: UserCog },
  MY_GIVING,
];

const LINKS_BY_ROLE: Record<UserRole, NavLink[]> = {
  admin: ADMIN_LINKS,
  editor: [OVERVIEW, BLOG, MY_GIVING],
  donor: [OVERVIEW, MY_GIVING],
};

export function DashboardNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const links = LINKS_BY_ROLE[role] ?? LINKS_BY_ROLE.donor;

  return (
    <nav className="flex shrink-0 gap-1 overflow-x-auto pb-2 sm:w-52 sm:flex-col sm:overflow-visible sm:pb-0">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
              active
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
