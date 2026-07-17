import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { recordPageView } from "@/lib/analytics";
import { PostList } from "@/components/blog/PostList";
import { FadeInSection } from "@/components/motion/FadeInSection";

// DBを見に行くページなので、ビルド時の静的生成ではなく常にリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

export default async function HomePage() {
  await recordPageView("/");

  const recentPosts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 4,
    include: { category: true, tags: { include: { tag: true } } },
  });

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl dark:bg-accent/10"
        />
        <div className="relative mx-auto max-w-3xl px-8 pb-20 pt-24 sm:pb-28 sm:pt-32">
          <FadeInSection>
            <p className="font-mono text-xs tracking-widest text-accent">
              PERSONAL HUB — SELF-HOSTED ON PROXMOX
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-gray-900 dark:text-gray-100 sm:text-6xl">
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
          </FadeInSection>
        </div>
      </section>

      {/* 最近の記事 */}
      <section className="mx-auto max-w-4xl border-t border-gray-100 px-8 py-16 dark:border-gray-900 sm:py-24">
        <FadeInSection>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-gray-800 dark:text-gray-200">
              最近の記事
            </h2>
            <Link href="/blog" className="text-sm text-accent hover:underline">
              すべて見る →
            </Link>
          </div>
        </FadeInSection>

        {recentPosts.length > 0 ? (
          <PostList posts={recentPosts} />
        ) : (
          <p className="mt-6 text-sm text-gray-400">
            まだ記事がありません。近々書き始める予定です。
          </p>
        )}
      </section>

      {/* クイックリンク */}
      <section className="mx-auto max-w-4xl border-t border-gray-100 px-8 py-16 dark:border-gray-900 sm:py-24">
        <FadeInSection>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/profile"
              className="group rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-md dark:border-gray-800"
            >
              <p className="font-display font-bold text-gray-900 dark:text-gray-100">
                プロフィール
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">自己紹介・スキル・資格</p>
            </Link>
            <Link
              href="/works"
              className="group rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-md dark:border-gray-800"
            >
              <p className="font-display font-bold text-gray-900 dark:text-gray-100">制作物</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">作ってきたものたち</p>
            </Link>
            <Link
              href="/contact"
              className="group rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-md dark:border-gray-800"
            >
              <p className="font-display font-bold text-gray-900 dark:text-gray-100">
                お問い合わせ
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">連絡はこちらから</p>
            </Link>
          </div>
        </FadeInSection>
      </section>
    </main>
  );
}
