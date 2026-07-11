import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { renderMarkdownWithToc } from "@/lib/markdown";
import { promoteScheduledPosts } from "@/lib/posts";
import { recordPageView } from "@/lib/analytics";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { PostList } from "@/components/blog/PostList";
import { CommentForm } from "./CommentForm";

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

async function getRelatedPosts(post: {
  id: string;
  categoryId: string | null;
  tags: { tagId: string }[];
}) {
  const tagIds = post.tags.map((t) => t.tagId);
  if (!post.categoryId && tagIds.length === 0) {
    return [];
  }

  const candidates = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: post.id },
      OR: [
        ...(post.categoryId ? [{ categoryId: post.categoryId }] : []),
        ...(tagIds.length > 0 ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
      ],
    },
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  return candidates
    .map((candidate) => {
      const sharedTags = candidate.tags.filter((t) => tagIds.includes(t.tagId)).length;
      const sameCategory = post.categoryId && candidate.categoryId === post.categoryId ? 1 : 0;
      return { candidate, score: sharedTags * 2 + sameCategory };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => s.candidate);
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
  await promoteScheduledPosts();

  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  await recordPageView(`/blog/${post.slug}`);

  const [{ html, toc }, relatedPosts, comments] = await Promise.all([
    Promise.resolve(renderMarkdownWithToc(post.body)),
    getRelatedPosts(post),
    prisma.comment.findMany({
      where: { postId: post.id, approved: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Breadcrumbs
        items={[
          { label: "TOP", href: "/" },
          { label: "ブログ", href: "/blog" },
          { label: post.title },
        ]}
      />

      <p className="mt-3 text-xs text-gray-400">
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

      {toc.length > 1 && (
        <nav className="mt-6 rounded-card border border-gray-200 p-4 text-sm dark:border-gray-800">
          <p className="font-semibold text-gray-700 dark:text-gray-300">目次</p>
          <ul className="mt-2 space-y-1">
            {toc.map((item) => (
              <li key={item.id} className={item.level === 3 ? "ml-4" : ""}>
                <a href={`#${item.id}`} className="text-accent hover:underline">
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <article
        className="prose prose-gray mt-8 max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {relatedPosts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">関連記事</h2>
          <PostList posts={relatedPosts} />
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          コメント{comments.length > 0 && ` (${comments.length})`}
        </h2>
        <ul className="mt-4 space-y-4">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-card border border-gray-200 p-4 text-sm dark:border-gray-800"
            >
              <p className="font-medium text-gray-800 dark:text-gray-200">{c.authorName}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {c.createdAt.toLocaleDateString("ja-JP")}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-gray-600 dark:text-gray-300">{c.body}</p>
            </li>
          ))}
        </ul>
        <CommentForm postId={post.id} />
      </section>
    </main>
  );
}
