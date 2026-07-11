import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { renderMarkdown } from "@/lib/markdown";

// 一覧ページと同じ理由で、ビルド時の静的生成を無効化する
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  return prisma.post.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { category: true, tags: { include: { tag: true } } },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const html = renderMarkdown(post.body);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <p className="text-xs text-gray-400">
        {post.publishedAt?.toLocaleDateString("ja-JP")}
        {post.category && (
          <Link
            href={`/blog/category/${post.category.slug}`}
            className="ml-2 text-accent hover:underline"
          >
            {post.category.name}
          </Link>
        )}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{post.title}</h1>

      {post.tags.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-2">
          {post.tags.map(({ tag }) => (
            <Link
              key={tag.id}
              href={`/blog/tag/${tag.slug}`}
              className="rounded-card bg-gray-100 px-2 py-0.5 text-xs text-gray-500 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              #{tag.name}
            </Link>
          ))}
        </p>
      )}

      <article
        className="prose prose-gray mt-8 max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}
