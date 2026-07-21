import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublishedPostBySlug } from "@/lib/blog";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/blog"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to blog
      </Link>

      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        {post.category && (
          <Link href={`/blog?category=${post.category.slug}`}>
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
            sizes="(max-width: 768px) 100vw, 768px"
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
