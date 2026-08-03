"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { categoryPath } from "@/lib/blog-paths";

export interface CategoryOption {
  name: string;
  slug: string;
}

/**
 * Category filter for the blog listing: a menu (works with tap, keyboard,
 * and outside-click dismissal) whose trigger shows the active category.
 * Selecting navigates to /blog or /blog/{category}.
 */
export function CategoryDropdown({
  categories,
  activeSlug,
}: {
  categories: CategoryOption[];
  activeSlug?: string;
}) {
  const active = categories.find((category) => category.slug === activeSlug);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="rounded-full">
            {active?.name ?? "All categories"}
            <ChevronDown className="size-4 transition-transform group-data-popup-open:rotate-180" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-auto min-w-48">
        <DropdownMenuItem render={<Link href="/blog" />}>
          All posts
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {categories.map((category) => (
          <DropdownMenuItem
            key={category.slug}
            render={<Link href={categoryPath(category.slug)} />}
          >
            {category.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
