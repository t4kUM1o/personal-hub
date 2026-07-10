import { redirect } from "next/navigation";
import { getCurrentSession, listUserSessions } from "@/lib/auth";
import { SessionsList, type SessionItem } from "./SessionsList";

export default async function SettingsPage() {
  const current = await getCurrentSession();
  if (!current) {
    redirect("/login");
  }

  const sessions = await listUserSessions(current.user.id);

  // Server -> Client Componentに渡すため、Dateをすべて文字列にシリアライズする
  const items: SessionItem[] = sessions.map(
    (s: Awaited<ReturnType<typeof listUserSessions>>[number]) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
    })
  );

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">設定</h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          ログイン履歴・デバイス管理
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          このアカウントでログインした履歴です。心当たりのないログインがあれば、そのデバイスを強制的にログアウトさせられます。
        </p>
        <SessionsList sessions={items} currentSessionId={current.sessionId} />
      </section>
    </main>
  );
}
