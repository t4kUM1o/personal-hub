import { readdir, stat } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getUploadsSize(): Promise<number> {
  try {
    const dir = path.join(process.cwd(), "uploads");
    const files = await readdir(dir);
    const sizes = await Promise.all(
      files.map(async (f) => (await stat(path.join(dir, f))).size)
    );
    return sizes.reduce((sum, s) => sum + s, 0);
  } catch {
    return 0;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default async function AdminSystemPage() {
  const [userCount, postCount, transactionCount, commentCount, uploadsSize] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.transaction.count(),
    prisma.comment.count(),
    getUploadsSize(),
  ]);

  const envChecks: Array<{ label: string; ok: boolean; value?: string }> = [
    { label: "GMAIL_USER（パスワードリセット送信元）", ok: Boolean(process.env.GMAIL_USER) },
    { label: "GMAIL_APP_PASSWORD", ok: Boolean(process.env.GMAIL_APP_PASSWORD) },
    {
      label: "ENCRYPTION_KEY（2段階認証用）",
      ok: Boolean(process.env.ENCRYPTION_KEY) && !/^0+$/.test(process.env.ENCRYPTION_KEY ?? ""),
    },
    {
      label: "APP_BASE_URL",
      ok: Boolean(process.env.APP_BASE_URL),
      value: process.env.APP_BASE_URL,
    },
    { label: "COOKIE_SECURE", ok: true, value: process.env.COOKIE_SECURE ?? "false" },
  ];

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">システム設定</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">データ件数</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-4">
          <div className="rounded-card border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">ユーザー</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {userCount}
            </p>
          </div>
          <div className="rounded-card border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">記事</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {postCount}
            </p>
          </div>
          <div className="rounded-card border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">家計簿の記録</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {transactionCount}
            </p>
          </div>
          <div className="rounded-card border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">コメント</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {commentCount}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">ストレージ</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          アップロード画像の合計サイズ: {formatSize(uploadsSize)}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          環境変数の設定状況
        </h2>
        <p className="mt-1 text-xs text-gray-400">値そのものは表示しません（セキュリティのため）</p>
        <ul className="mt-3 divide-y divide-gray-100 rounded-card border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {envChecks.map((check) => (
            <li
              key={check.label}
              className="flex items-center justify-between px-4 py-2 text-sm"
            >
              <span className="text-gray-700 dark:text-gray-300">{check.label}</span>
              <span className={check.ok ? "text-accent" : "text-red-600 dark:text-red-400"}>
                {check.ok ? (check.value ?? "設定済み") : "未設定"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
