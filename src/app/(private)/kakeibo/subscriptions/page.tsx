import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { createSubscription } from "../actions";
import { BackLink } from "@/components/ui/BackLink";
import { processDueSubscriptions } from "@/lib/subscriptions";
import { SubscriptionRow } from "./SubscriptionRow";

export const dynamic = "force-dynamic";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export default async function SubscriptionsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  // このページを開いた時にも、溜まっている分があれば追いつかせておく
  await processDueSubscriptions(user.id);

  const [subscriptions, accounts, categories] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: { nextBillingAt: "asc" },
      include: { account: true },
    }),
    prisma.account.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.transactionCategory.findMany({
      where: { userId: user.id, type: "EXPENSE" },
      orderBy: { name: "asc" },
    }),
  ]);

  const monthlyTotal = subscriptions
    .filter((s) => s.active)
    .reduce((sum, s) => sum + (s.interval === "MONTHLY" ? s.amount : Math.round(s.amount / 12)), 0);

  const inputClass =
    "w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900";

  return (
    <main className="p-8">
      <BackLink href="/kakeibo" label="家計簿に戻る" />
      <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">サブスク管理</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        月換算の合計:{" "}
        <span className="font-medium text-gray-800 dark:text-gray-200">{yen(monthlyTotal)}</span>
        　次回請求日が来ると、家計簿の記録に自動的に追加されます。
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
          action={createSubscription}
          className="mt-6 max-w-md space-y-3 rounded-card border border-gray-200 p-4 dark:border-gray-800"
        >
          <input
            type="text"
            name="name"
            required
            placeholder="サービス名（例: Netflix）"
            className={inputClass}
          />
          <div className="flex gap-2">
            <input
              type="number"
              name="amount"
              required
              min={1}
              placeholder="金額"
              className={`${inputClass} w-28`}
            />
            <select name="interval" className={inputClass}>
              <option value="MONTHLY">毎月</option>
              <option value="YEARLY">毎年</option>
            </select>
          </div>
          <label className="block text-xs text-gray-500 dark:text-gray-400">
            次回請求日
            <input type="date" name="nextBillingAt" required className={`mt-1 ${inputClass}`} />
          </label>
          <select name="accountId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              引き落とし口座を選択
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select name="categoryId" defaultValue="" className={inputClass}>
            <option value="">未分類</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input type="text" name="memo" placeholder="メモ（任意）" className={inputClass} />
          <button
            type="submit"
            className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            追加
          </button>
        </form>
      )}

      <ul className="mt-6 max-w-md space-y-2">
        {subscriptions.map((s) => (
          <SubscriptionRow
            key={s.id}
            subscription={{
              id: s.id,
              name: s.name,
              amount: s.amount,
              interval: s.interval,
              nextBillingAt: s.nextBillingAt.toISOString(),
              active: s.active,
              memo: s.memo,
              accountId: s.accountId,
              accountName: s.account.name,
              categoryId: s.categoryId,
            }}
            accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          />
        ))}
        {subscriptions.length === 0 && (
          <li className="rounded-card border border-gray-200 px-4 py-6 text-center text-gray-400 dark:border-gray-800">
            まだ登録されていません
          </li>
        )}
      </ul>
    </main>
  );
}
