import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  login: "ログイン",
  password_reset: "パスワードリセット",
  "2fa_enabled": "2段階認証を有効化",
  "2fa_disabled": "2段階認証を無効化",
  user_role_changed: "ユーザー権限変更",
  user_deleted: "ユーザー削除",
};

export default async function AdminLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { email: true } } },
  });

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ログ管理</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        セキュリティに関わる操作の履歴です（直近200件）。
      </p>

      <div className="mt-6 overflow-x-auto rounded-card border border-gray-200 dark:border-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2 font-medium">日時</th>
              <th className="px-4 py-2 font-medium">操作</th>
              <th className="px-4 py-2 font-medium">ユーザー</th>
              <th className="px-4 py-2 font-medium">詳細</th>
              <th className="px-4 py-2 font-medium">IPアドレス</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-300">
                  {log.createdAt.toLocaleString("ja-JP")}
                </td>
                <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                  {ACTION_LABELS[log.action] ?? log.action}
                </td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                  {log.user?.email ?? "-"}
                </td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{log.detail ?? "-"}</td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                  {log.ipAddress ?? "-"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  まだログがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
