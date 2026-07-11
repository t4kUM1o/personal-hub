import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession, listUserSessions } from "@/lib/auth";
import { SessionsList, type SessionItem } from "./SessionsList";
import { disableTwoFactor } from "./actions";
import { RegenerateBackupCodesButton } from "./RegenerateBackupCodesButton";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";

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
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">2段階認証</h2>
        {current.user.totpEnabled ? (
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
            <span className="rounded-card bg-accent/10 px-2 py-1 text-xs text-accent">有効</span>
            <RegenerateBackupCodesButton />
            <form action={disableTwoFactor}>
              <ConfirmSubmitButton
                confirmMessage="2段階認証を無効にしますか？"
                className="text-red-600 hover:underline dark:text-red-400"
              >
                無効にする
              </ConfirmSubmitButton>
            </form>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">現在、無効になっています。</p>
            <Link
              href="/settings/2fa/setup"
              className="mt-2 inline-block rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              設定する
            </Link>
          </div>
        )}
      </section>

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
