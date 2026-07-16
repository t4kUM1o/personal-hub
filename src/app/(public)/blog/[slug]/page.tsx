import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { renderMarkdownWithToc } from "@/lib/markdown";
import { promoteScheduledPosts } from "@/lib/posts";
import { recordPageView } from "@/lib/analytics";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { PostList } from "@/components/blog/PostList";
import { FadeInSection } from "@/components/motion/FadeInSection";
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
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
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
    <main>
      {post.coverImage && (
        <div className="h-[38vh] w-full overflow-hidden sm:h-[48vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="mx-auto max-w-2xl px-8 py-12">
        <FadeInSection>
          <Breadcrumbs
            items={[
              { label: "TOP", href: "/" },
              { label: "ブログ", href: "/blog" },
              { label: post.title },
            ]}
          />

          <p className="mt-4 text-xs text-gray-400">
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
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
            {post.title}
          </h1>

          {post.tags.length > 0 && (
            <p className="mt-4 flex flex-wrap gap-2">
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
        </FadeInSection>

        {toc.length > 1 && (
          <FadeInSection delay={0.1}>
            <nav className="mt-8 rounded-card border border-gray-200 p-4 text-sm dark:border-gray-800">
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
          </FadeInSection>
        )}

        <FadeInSection delay={0.15}>
          <article
            className="prose prose-gray mt-10 max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </FadeInSection>

        {relatedPosts.length > 0 && (
          <FadeInSection delay={0.05}>
            <section className="mt-16">
              <h2 className="font-display text-lg font-bold text-gray-800 dark:text-gray-200">
                関連記事
              </h2>
              <PostList posts={relatedPosts} />
            </section>
          </FadeInSection>
        )}

        <FadeInSection delay={0.05}>
          <section className="mt-16">
            <h2 className="font-display text-lg font-bold text-gray-800 dark:text-gray-200">
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
                  <p className="mt-2 whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                    {c.body}
                  </p>
                </li>
              ))}
            </ul>
            <CommentForm postId={post.id} />
          </section>
        </FadeInSection>
      </div>
    </main>
  );
}
