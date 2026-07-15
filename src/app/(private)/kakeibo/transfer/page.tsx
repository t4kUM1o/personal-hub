import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { createTransfer } from "../actions";
import { BackLink } from "@/components/ui/BackLink";

export const dynamic = "force-dynamic";

function todayValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default async function TransferPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  const inputClass =
    "mt-1 w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900";

  return (
    <main className="p-8">
      <BackLink href="/kakeibo" label="家計簿に戻る" />
      <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">口座間の振替</h1>
      <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
        電子マネーのチャージなど、自分の口座間でお金を移動させる時に使います。振替元の残高が減り、振替先の残高が増えます（月次の収支サマリーには計上されません）。
      </p>

      {accounts.length < 2 ? (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          振替には口座が2つ以上必要です。先に{" "}
          <Link href="/kakeibo/accounts" className="text-accent hover:underline">
            口座管理
          </Link>{" "}
          で追加してください。
        </p>
      ) : (
        <form action={createTransfer} className="mt-6 max-w-md space-y-4">
          <label className="block text-sm text-gray-600 dark:text-gray-400">
            振替元（残高が減る方。例: クレジットカード・銀行）
            <select name="fromAccountId" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                選択してください
              </option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-gray-600 dark:text-gray-400">
            振替先（残高が増える方。例: 電子マネー）
            <select name="toAccountId" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                選択してください
              </option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-gray-600 dark:text-gray-400">
            金額（円）
            <input type="number" name="amount" min={1} step={1} required className={inputClass} />
          </label>

          <label className="block text-sm text-gray-600 dark:text-gray-400">
            日付
            <input
              type="date"
              name="date"
              required
              defaultValue={todayValue()}
              className={inputClass}
            />
          </label>

          <label className="block text-sm text-gray-600 dark:text-gray-400">
            メモ（任意）
            <input type="text" name="memo" className={inputClass} />
          </label>

          <button
            type="submit"
            className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            振替する
          </button>
        </form>
      )}
    </main>
  );
}
