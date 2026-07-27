"use client";

import { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import { postPath } from "@/lib/blog-paths";

export interface PostItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  tags: string[];
  publishedAt?: string;
  author?: string;
  category: { name: string; slug: string } | null;
}

export function BlogList({
  initialItems,
  categorySlug,
  pageSize,
}: {
  initialItems: PostItem[];
  categorySlug?: string;
  pageSize: number;
}) {
  const fetchPage = useCallback(
    async (page: number, query: string): Promise<PostItem[]> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (categorySlug) params.set("category", categorySlug);
      if (query) params.set("q", query);
      const res = await fetch(`/api/v1/blog?${params.toString()}`);
      if (!res.ok) return [];
      const data = (await res.json()) as { items?: PostItem[] };
      return data.items ?? [];
    },
    [pageSize, categorySlug],
  );

  const { items, sentinelRef, loading, done, query, setQuery } =
    useInfiniteList({ initialItems, pageSize, fetchPage });

  return (
    <div className="flex flex-col gap-6">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search posts…"
        className="max-w-sm"
      />

      {items.length === 0 ? (
        <p className="text-muted-foreground">
          {query ? "No posts match your search." : "No posts published yet."}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((post) => (
            <Link
              key={post.id}
              href={postPath(post)}
              className="group hover:border-foreground/20 flex flex-col overflow-hidden rounded-lg border transition-colors"
            >
              <div className="bg-muted relative aspect-video w-full">
                {post.coverImage ? (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                {post.category && (
                  <Badge variant="secondary" className="w-fit">
                    {post.category.name}
                  </Badge>
                )}
                <h2 className="font-semibold tracking-tight group-hover:text-[#0a7d3e]">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-muted-foreground line-clamp-3 text-sm">
                    {post.excerpt}
                  </p>
                )}
                <div className="text-muted-foreground mt-auto flex flex-wrap items-center gap-x-2 text-xs">
                  {post.author && <span>By {post.author}</span>}
                  {post.author && post.publishedAt && <span>·</span>}
                  {post.publishedAt && (
                    <time>
                      {format(new Date(post.publishedAt), "dd MMM yyyy")}
                    </time>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!done && <div ref={sentinelRef} aria-hidden className="h-6" />}
      {loading && (
        <p className="text-muted-foreground py-6 text-center text-sm">
          Loading…
        </p>
      )}
    </div>
  );
}
