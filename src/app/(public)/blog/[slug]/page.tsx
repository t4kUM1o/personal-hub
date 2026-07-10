import { notFound } from "next/navigation";
import type { Metadata } from "next";
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
        {post.category && <span className="ml-2 text-accent">{post.category.name}</span>}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{post.title}</h1>

      {post.tags.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-2">
          {post.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="rounded-card bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            >
              #{tag.name}
            </span>
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
