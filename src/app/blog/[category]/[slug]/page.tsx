import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublishedPostBySlug } from "@/lib/blog";
import { categoryPath, postPath } from "@/lib/blog-paths";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return { title: "Post not found · Maatram" };
  return {
    title: `${post.title} · Maatram`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  // Enforce the canonical URL so a post lives at exactly one path.
  const canonical = postPath(post);
  if (canonical !== `/blog/${category}/${slug}`) redirect(canonical);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href={post.category ? categoryPath(post.category.slug) : "/blog"}
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to {post.category?.name ?? "blog"}
      </Link>

      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        {post.category && (
          <Link href={categoryPath(post.category.slug)}>
            <Badge variant="secondary">{post.category.name}</Badge>
          </Link>
        )}
        {post.author && (
          <span className="text-muted-foreground text-sm">
            By {post.author}
          </span>
        )}
        {post.publishedAt && (
          <time className="text-muted-foreground text-sm">
            {format(new Date(post.publishedAt), "dd MMM yyyy")}
          </time>
        )}
      </div>

      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        {post.title}
      </h1>

      {post.coverImage && (
        <div className="bg-muted relative mt-6 aspect-video w-full overflow-hidden rounded-lg">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            unoptimized
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="object-cover"
          />
        </div>
      )}

      <div className="prose prose-neutral dark:prose-invert prose-headings:tracking-tight prose-a:text-[#0a7d3e] mt-8 max-w-none">
        <Markdown remarkPlugins={[remarkGfm]}>{post.content}</Markdown>
      </div>

      {post.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2 border-t pt-6">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </main>
  );
}
