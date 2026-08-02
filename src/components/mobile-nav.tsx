"use client";

import Link from "next/link";
import { Heart, Menu } from "lucide-react";
import type { ReactNode } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NavLink {
  label: string;
  href: string;
}

/**
 * Hamburger menu for small screens: slide-in sheet with the full nav, a
 * Donate CTA, and the auth control passed in from the server header.
 */
export function MobileNav({
  links,
  authSlot,
}: {
  links: NavLink[];
  authSlot?: ReactNode;
}) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="lg:hidden">
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        }
      />
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold">Maatram</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-6">
          {links.map((link) => (
            <SheetClose
              key={link.href}
              render={
                <Link
                  href={link.href}
                  className="hover:bg-accent rounded-lg px-3 py-2.5 text-base font-medium"
                />
              }
            >
              {link.label}
            </SheetClose>
          ))}
        </nav>

        <SheetFooter>
          <SheetClose
            render={
              <Link
                href="/donate"
                className={cn(buttonVariants({ size: "lg" }), "w-full")}
              />
            }
          >
            <Heart className="size-4" />
            Donate now
          </SheetClose>
          {authSlot}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
