import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PostList } from "@/components/blog/PostList";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { promoteScheduledPosts } from "@/lib/posts";

// DBを見に行くページなので、ビルド時の静的生成ではなく常にリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await promoteScheduledPosts();

  const { q } = await searchParams;

  const where: Prisma.PostWhereInput = { status: "PUBLISHED" };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
    ];
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    include: { category: true, tags: { include: { tag: true } } },
  });

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Breadcrumbs items={[{ label: "TOP", href: "/" }, { label: "ブログ" }]} />
      <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">ブログ</h1>

      <form method="GET" className="mt-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="記事を検索"
          className="flex-1 rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900"
        />
        <button
          type="submit"
          className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          検索
        </button>
        {q && (
          <Link
            href="/blog"
            className="flex items-center px-2 text-sm text-gray-500 hover:underline dark:text-gray-400"
          >
            クリア
          </Link>
        )}
      </form>

      <PostList posts={posts} />
    </main>
  );
}
