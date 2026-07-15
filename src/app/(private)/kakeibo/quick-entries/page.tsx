import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { createQuickEntry, deleteQuickEntry } from "../actions";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { BackLink } from "@/components/ui/BackLink";

export const dynamic = "force-dynamic";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export default async function QuickEntriesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const [entries, accounts, categories] = await Promise.all([
    prisma.quickEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: { account: true },
    }),
    prisma.account.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.transactionCategory.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="p-8">
      <BackLink href="/kakeibo" label="家計簿に戻る" />
      <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        クイック記録の設定
      </h1>
      <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
        よく使う入力をボタン化しておけます（例:「ポイ活 +¥100」）。家計簿画面のボタンを押すと、今日の日付でそのまま記録されます。
      </p>

      {accounts.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          先に{" "}
          <Link href="/kakeibo/accounts" className="text-accent hover:underline">
            口座管理
          </Link>{" "}
          から口座を1つ作成してください。
        </p>
      ) : (
        <form
          action={createQuickEntry}
          className="mt-6 max-w-md space-y-3 rounded-card border border-gray-200 p-4 dark:border-gray-800"
        >
          <input
            type="text"
            name="label"
            required
            placeholder="ボタンの名前（例: ポイ活）"
            className="w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900"
          />
          <div className="flex gap-2">
            <select
              name="type"
              className="rounded-card border border-gray-300 px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="INCOME">収入</option>
              <option value="EXPENSE">支出</option>
            </select>
            <input
              type="number"
              name="amount"
              required
              min={1}
              placeholder="金額"
              className="w-28 rounded-card border border-gray-300 px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <select
            name="accountId"
            required
            defaultValue=""
            className="w-full rounded-card border border-gray-300 px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="" disabled>
              口座を選択
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            name="categoryId"
            defaultValue=""
            className="w-full rounded-card border border-gray-300 px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">未分類</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.type === "INCOME" ? "収入" : "支出"} / {c.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="memo"
            placeholder="メモ（任意。省略するとボタン名がメモになります）"
            className="w-full rounded-card border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <button
            type="submit"
            className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            追加
          </button>
        </form>
      )}

      <ul className="mt-6 max-w-md divide-y divide-gray-100 rounded-card border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              {e.label}{" "}
              <span className="text-gray-400">
                （{e.type === "INCOME" ? "+" : "-"}
                {yen(e.amount)} / {e.account.name}）
              </span>
            </span>
            <form action={deleteQuickEntry}>
              <input type="hidden" name="id" value={e.id} />
              <ConfirmSubmitButton
                confirmMessage={`「${e.label}」を削除しますか？`}
                className="text-red-600 hover:underline dark:text-red-400"
              >
                削除
              </ConfirmSubmitButton>
            </form>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="px-4 py-6 text-center text-gray-400">まだありません</li>
        )}
      </ul>
    </main>
  );
}
