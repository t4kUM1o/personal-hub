import Link from "next/link";
import { prisma } from "@/lib/prisma";

// DBを見に行くページなので、ビルド時の静的生成ではなく常にリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [postStatusCounts, commentApprovalCounts, categoryCount, tagCount, userCount, pageViewCount] =
    await Promise.all([
      prisma.post.groupBy({ by: ["status"], _count: true }),
      prisma.comment.groupBy({ by: ["approved"], _count: true }),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.user.count(),
      prisma.pageView.count(),
    ]);

  const countForStatus = (status: string) =>
    postStatusCounts.find((p) => p.status === status)?._count ?? 0;
  const published = countForStatus("PUBLISHED");
  const draft = countForStatus("DRAFT");
  const scheduled = countForStatus("SCHEDULED");

  const pendingComments = commentApprovalCounts.find((c) => c.approved === false)?._count ?? 0;
  const approvedComments = commentApprovalCounts.find((c) => c.approved === true)?._count ?? 0;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">管理ダッシュボード</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/blog"
          className="rounded-card border border-gray-200 p-4 transition-colors hover:border-accent dark:border-gray-800"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">記事</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {published}件公開中
          </p>
          <p className="mt-1 text-xs text-gray-400">
            下書き {draft} / 予約 {scheduled}
          </p>
        </Link>

        <Link
          href="/admin/blog/comments"
          className="rounded-card border border-gray-200 p-4 transition-colors hover:border-accent dark:border-gray-800"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">コメント</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {pendingComments}件未承認
          </p>
          <p className="mt-1 text-xs text-gray-400">承認済み {approvedComments}件</p>
        </Link>

        <Link
          href="/admin/users"
          className="rounded-card border border-gray-200 p-4 transition-colors hover:border-accent dark:border-gray-800"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">ユーザー</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {userCount}人
          </p>
        </Link>

        <Link
          href="/admin/analytics"
          className="rounded-card border border-gray-200 p-4 transition-colors hover:border-accent dark:border-gray-800"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">累計ページビュー</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {pageViewCount.toLocaleString("ja-JP")}
          </p>
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">ブログ管理</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Link
            href="/admin/blog/categories"
            className="rounded-card border border-gray-200 p-4 transition-colors hover:border-accent dark:border-gray-800"
          >
            <p className="font-medium text-gray-900 dark:text-gray-100">カテゴリー</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{categoryCount}件</p>
          </Link>
          <Link
            href="/admin/blog/tags"
            className="rounded-card border border-gray-200 p-4 transition-colors hover:border-accent dark:border-gray-800"
          >
            <p className="font-medium text-gray-900 dark:text-gray-100">タグ</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tagCount}件</p>
          </Link>
          <Link
            href="/admin/blog/new"
            className="rounded-card bg-accent p-4 text-white transition-colors hover:bg-accent-hover"
          >
            <p className="font-medium">新規記事を書く</p>
            <p className="mt-1 text-sm text-white/80">Markdownで記事を作成</p>
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">その他の管理項目</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-4">
          <Link
            href="/admin/analytics"
            className="rounded-card border border-gray-200 p-4 transition-colors hover:border-accent dark:border-gray-800"
          >
            <p className="font-medium text-gray-900 dark:text-gray-100">アクセス解析</p>
          </Link>
          <Link
            href="/admin/logs"
            className="rounded-card border border-gray-200 p-4 transition-colors hover:border-accent dark:border-gray-800"
          >
            <p className="font-medium text-gray-900 dark:text-gray-100">ログ管理</p>
          </Link>
          <Link
            href="/admin/media"
            className="rounded-card border border-gray-200 p-4 transition-colors hover:border-accent dark:border-gray-800"
          >
            <p className="font-medium text-gray-900 dark:text-gray-100">メディア管理</p>
          </Link>
          <Link
            href="/admin/system"
            className="rounded-card border border-gray-200 p-4 transition-colors hover:border-accent dark:border-gray-800"
          >
            <p className="font-medium text-gray-900 dark:text-gray-100">システム設定</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
