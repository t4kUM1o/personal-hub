import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalViews, recentViews, topPaths] = await Promise.all([
    prisma.pageView.count(),
    prisma.pageView.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.pageView.groupBy({
      by: ["path"],
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
  ]);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">アクセス解析</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Cookie等は使わず、パスとアクセス時刻のみを記録する簡易的な集計です。
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">累計ページビュー</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {totalViews.toLocaleString("ja-JP")}
          </p>
        </div>
        <div className="rounded-card border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">直近30日間</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {recentViews.toLocaleString("ja-JP")}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          人気ページ（上位10件）
        </h2>
        <ul className="mt-3 divide-y divide-gray-100 rounded-card border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {topPaths.map((p) => (
            <li key={p.path} className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="text-gray-700 dark:text-gray-300">{p.path}</span>
              <span className="text-gray-400">{p._count.path.toLocaleString("ja-JP")}回</span>
            </li>
          ))}
          {topPaths.length === 0 && (
            <li className="px-4 py-6 text-center text-gray-400">まだデータがありません</li>
          )}
        </ul>
      </section>
    </main>
  );
}
