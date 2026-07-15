import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// DBを見に行くページなので、ビルド時の静的生成ではなく常にリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [monthTransactions, postStatusCounts, pendingCommentsCount, recentPosts] =
    await Promise.all([
      prisma.transaction.findMany({
        where: { userId: user.id, date: { gte: monthStart, lt: monthEnd } },
      }),
      prisma.post.groupBy({ by: ["status"], _count: true }),
      prisma.comment.count({ where: { approved: false } }),
      prisma.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 3,
        select: { id: true, title: true, slug: true, publishedAt: true },
      }),
    ]);

  const income = monthTransactions
    .filter((t) => t.type === "INCOME" && !t.transferGroupId)
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = monthTransactions
    .filter((t) => t.type === "EXPENSE" && !t.transferGroupId)
    .reduce((sum, t) => sum + t.amount, 0);

  const countFor = (status: string) =>
    postStatusCounts.find((p) => p.status === status)?._count ?? 0;
  const publishedCount = countFor("PUBLISHED");
  const draftCount = countFor("DRAFT");
  const scheduledCount = countFor("SCHEDULED");

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ダッシュボード</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {now.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link
          href="/kakeibo"
          className="rounded-card border border-gray-200 p-4 transition-colors hover:border-accent dark:border-gray-800"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">今月の収支</p>
          <p
            className={`mt-1 text-xl font-semibold ${
              income - expense >= 0 ? "text-accent" : "text-red-600 dark:text-red-400"
            }`}
          >
            {yen(income - expense)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            収入 {yen(income)} / 支出 {yen(expense)}
          </p>
        </Link>

        <Link
          href="/admin/blog"
          className="rounded-card border border-gray-200 p-4 transition-colors hover:border-accent dark:border-gray-800"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">ブログ記事</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {publishedCount}件公開中
          </p>
          <p className="mt-1 text-xs text-gray-400">
            下書き {draftCount} / 予約 {scheduledCount}
          </p>
        </Link>

        <Link
          href="/admin/blog/comments"
          className="rounded-card border border-gray-200 p-4 transition-colors hover:border-accent dark:border-gray-800"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">未承認コメント</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {pendingCommentsCount}件
          </p>
        </Link>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">最近の記事</h2>
          <Link href="/blog" className="text-sm text-accent hover:underline">
            すべて見る
          </Link>
        </div>
        {recentPosts.length > 0 ? (
          <ul className="mt-3 divide-y divide-gray-100 rounded-card border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {recentPosts.map((p) => (
              <li key={p.id} className="px-4 py-3 text-sm">
                <Link
                  href={`/blog/${p.slug}`}
                  className="text-gray-800 hover:text-accent dark:text-gray-200"
                >
                  {p.title}
                </Link>
                <span className="ml-2 text-xs text-gray-400">
                  {p.publishedAt?.toLocaleDateString("ja-JP")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-gray-400">まだ公開記事がありません</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">クイックリンク</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link
            href="/kakeibo/new"
            className="rounded-card bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-hover"
          >
            家計簿を記録
          </Link>
          <Link
            href="/admin/blog/new"
            className="rounded-card bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-hover"
          >
            記事を書く
          </Link>
          <Link
            href="/settings"
            className="rounded-card border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
          >
            設定を開く
          </Link>
        </div>
      </section>
    </main>
  );
}
