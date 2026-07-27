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
import { categoryPath } from "@/lib/blog-paths";

/**
 * Header "Blog" dropdown. A menu (not a hover panel) so it works with tap on
 * touch devices, keyboard, and outside-click dismissal; "All posts" covers
 * navigation to the blog index.
 */
export function BlogNavMenu({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground data-popup-open:text-foreground inline-flex items-center gap-0.5 text-sm"
          >
            Blog
            <ChevronDown className="size-3.5 transition-transform group-data-popup-open:rotate-180" />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-auto min-w-44">
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
