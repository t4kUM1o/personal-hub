import Link from "next/link";
import { prisma } from "@/lib/prisma";

// DBを見に行くページなので、ビルド時の静的生成ではなく常にリクエスト時にレンダリングする
// (ビルド時点ではまだDATABASE_URLが渡っていないため、静的生成しようとすると失敗する)
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: { category: true, tags: { include: { tag: true } } },
  });

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ブログ</h1>

      <ul className="mt-8 space-y-8">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`} className="group block">
              <p className="text-xs text-gray-400">
                {post.publishedAt?.toLocaleDateString("ja-JP")}
                {post.category && <span className="ml-2 text-accent">{post.category.name}</span>}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900 group-hover:text-accent dark:text-gray-100">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{post.excerpt}</p>
              )}
              {post.tags.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-2">
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
            </Link>
          </li>
        ))}
        {posts.length === 0 && <p className="text-gray-400">まだ記事がありません</p>}
      </ul>
    </main>
  );
}
