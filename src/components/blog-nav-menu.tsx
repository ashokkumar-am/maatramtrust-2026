"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { categoryPath } from "@/lib/blog-paths";

/**
 * Header "Blog" item: a menu of the blog's categories (works with tap,
 * keyboard, and outside-click dismissal). Each item navigates to
 * /blog/{category}.
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
      <DropdownMenuContent align="start" className="w-auto min-w-48">
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
