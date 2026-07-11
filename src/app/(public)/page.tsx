import Link from "next/link";
import { prisma } from "@/lib/prisma";

// DBを見に行くページなので、ビルド時の静的生成ではなく常にリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recentPosts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { id: true, slug: true, title: true, excerpt: true, publishedAt: true },
  });

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-8 pb-16 pt-20 sm:pt-28">
        <p className="font-mono text-xs tracking-widest text-accent">
          PERSONAL HUB — SELF-HOSTED ON PROXMOX
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
          考えたこと、作ったもの、
          <br />
          暮らしの記録。
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-gray-500 dark:text-gray-400">
          自分の手元のサーバーで動かしている、個人用のブログと記録の場所です。
          技術的なメモから日々の暮らしまで、ゆるく書いていきます。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/blog"
            className="rounded-card bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            ブログを読む
          </Link>
          <Link
            href="/profile"
            className="rounded-card border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
          >
            プロフィールを見る
          </Link>
        </div>
      </section>

      {/* 最近の記事 */}
      <section className="mx-auto max-w-3xl border-t border-gray-100 px-8 py-16 dark:border-gray-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">最近の記事</h2>
          <Link href="/blog" className="text-sm text-accent hover:underline">
            すべて見る →
          </Link>
        </div>

        {recentPosts.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group rounded-card border border-gray-200 p-4 transition-colors hover:border-accent dark:border-gray-800"
              >
                <p className="text-xs text-gray-400">
                  {post.publishedAt?.toLocaleDateString("ja-JP")}
                </p>
                <h3 className="mt-2 font-medium text-gray-900 group-hover:text-accent dark:text-gray-100">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                    {post.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-gray-400">
            まだ記事がありません。近々書き始める予定です。
          </p>
        )}
      </section>

      {/* クイックリンク */}
      <section className="mx-auto max-w-3xl border-t border-gray-100 px-8 py-16 dark:border-gray-900">
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/profile"
            className="rounded-card border border-gray-200 p-5 transition-colors hover:border-accent dark:border-gray-800"
          >
            <p className="font-medium text-gray-900 dark:text-gray-100">プロフィール</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">自己紹介・スキル・資格</p>
          </Link>
          <Link
            href="/works"
            className="rounded-card border border-gray-200 p-5 transition-colors hover:border-accent dark:border-gray-800"
          >
            <p className="font-medium text-gray-900 dark:text-gray-100">制作物</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">作ってきたものたち</p>
          </Link>
          <Link
            href="/contact"
            className="rounded-card border border-gray-200 p-5 transition-colors hover:border-accent dark:border-gray-800"
          >
            <p className="font-medium text-gray-900 dark:text-gray-100">お問い合わせ</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">連絡はこちらから</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
