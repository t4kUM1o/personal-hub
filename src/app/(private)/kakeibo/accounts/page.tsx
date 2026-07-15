import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { createAccount, deleteAccount, updateAccountBilling, updateAccountBalance } from "../actions";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { getAccountBalances } from "@/lib/accountBalances";

// DBを見に行くページなので、ビルド時の静的生成ではなく常にリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  CASH: "現金",
  BANK: "銀行",
  CREDIT_CARD: "クレジットカード",
  E_MONEY: "電子マネー",
};

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;
const md = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;

export default async function AccountsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const [accounts, balances] = await Promise.all([
    prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      include: { _count: { select: { transactions: true } } },
    }),
    getAccountBalances(user.id),
  ]);

  const balanceById = new Map(balances.map((b) => [b.id, b]));

  return (
    <main className="p-8">
      <Link href="/kakeibo" className="text-sm text-accent hover:underline">
        ← 家計簿に戻る
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">口座管理</h1>

      <form action={createAccount} className="mt-6 max-w-md space-y-3 rounded-card border border-gray-200 p-4 dark:border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            name="name"
            required
            placeholder="口座名（例: 三井住友銀行）"
            className="flex-1 rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900"
          />
          <select
            name="type"
            className="rounded-card border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="CASH">現金</option>
            <option value="BANK">銀行</option>
            <option value="CREDIT_CARD">クレジットカード</option>
            <option value="E_MONEY">電子マネー</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          初期残高（記録を始める時点の残高。クレジットカードの場合は空欄でOK）
        </label>
        <input
          type="number"
          name="initialBalance"
          placeholder="0"
          className="w-32 rounded-card border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
        />

        <details className="text-xs text-gray-500 dark:text-gray-400">
          <summary className="cursor-pointer select-none">
            クレジットカードの締め日・引き落とし日を設定する（任意）
          </summary>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1">
              締め日
              <input
                type="number"
                name="closingDay"
                min={1}
                max={31}
                placeholder="例: 15"
                className="w-16 rounded-card border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
              />
              日
            </label>
            <label className="flex items-center gap-1">
              引き落とし日
              <input
                type="number"
                name="paymentDay"
                min={1}
                max={31}
                placeholder="例: 27"
                className="w-16 rounded-card border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
              />
              日
            </label>
            <label className="flex items-center gap-1">
              <select
                name="paymentMonthOffset"
                defaultValue="1"
                className="rounded-card border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="0">当月</option>
                <option value="1">翌月</option>
                <option value="2">翌々月</option>
              </select>
              に引き落とし
            </label>
          </div>
        </details>

        <button
          type="submit"
          className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          追加
        </button>
      </form>

      <ul className="mt-6 max-w-md space-y-3">
        {accounts.map((a) => {
          const info = balanceById.get(a.id);
          return (
            <li
              key={a.id}
              className="rounded-card border border-gray-200 px-4 py-3 text-sm dark:border-gray-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">
                  {a.name}{" "}
                  <span className="text-gray-400">
                    （{ACCOUNT_TYPE_LABEL[a.type]} / {a._count.transactions}件）
                  </span>
                </span>
                <form action={deleteAccount}>
                  <input type="hidden" name="id" value={a.id} />
                  <ConfirmSubmitButton
                    confirmMessage={`「${a.name}」を削除しますか？`}
                    className="text-red-600 hover:underline dark:text-red-400"
                  >
                    削除
                  </ConfirmSubmitButton>
                </form>
              </div>

              {a.type !== "CREDIT_CARD" && (
                <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    現在の残高:{" "}
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {yen(info?.balance ?? 0)}
                    </span>
                  </p>
                  <form
                    action={updateAccountBalance}
                    className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
                  >
                    <input type="hidden" name="id" value={a.id} />
                    <label className="flex items-center gap-1">
                      初期残高
                      <input
                        type="number"
                        name="initialBalance"
                        defaultValue={a.initialBalance}
                        className="w-24 rounded-card border border-gray-300 px-1.5 py-1 dark:border-gray-700 dark:bg-gray-900"
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded-card bg-gray-100 px-2 py-1 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      保存
                    </button>
                  </form>
                </div>
              )}

              {a.type === "CREDIT_CARD" && (
                <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                  {info?.billing ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      今回のご利用期間: {md(info.billing.cycleStart)}〜{md(info.billing.cycleEnd)}
                      　利用額:{" "}
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {yen(info.billing.total)}
                      </span>
                      <br />
                      次回引き落とし予定日:{" "}
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {info.billing.paymentDate.toLocaleDateString("ja-JP")}
                      </span>
                      （土日祝は翌平日に自動調整）
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">締め日・引き落とし日が未設定です</p>
                  )}

                  <form
                    action={updateAccountBilling}
                    className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
                  >
                    <input type="hidden" name="id" value={a.id} />
                    <label className="flex items-center gap-1">
                      締め日
                      <input
                        type="number"
                        name="closingDay"
                        min={1}
                        max={31}
                        defaultValue={a.closingDay ?? ""}
                        className="w-14 rounded-card border border-gray-300 px-1.5 py-1 dark:border-gray-700 dark:bg-gray-900"
                      />
                      日
                    </label>
                    <label className="flex items-center gap-1">
                      引き落とし日
                      <input
                        type="number"
                        name="paymentDay"
                        min={1}
                        max={31}
                        defaultValue={a.paymentDay ?? ""}
                        className="w-14 rounded-card border border-gray-300 px-1.5 py-1 dark:border-gray-700 dark:bg-gray-900"
                      />
                      日
                    </label>
                    <select
                      name="paymentMonthOffset"
                      defaultValue={String(a.paymentMonthOffset ?? 1)}
                      className="rounded-card border border-gray-300 px-1.5 py-1 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <option value="0">当月</option>
                      <option value="1">翌月</option>
                      <option value="2">翌々月</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-card bg-gray-100 px-2 py-1 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      保存
                    </button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
        {accounts.length === 0 && (
          <li className="rounded-card border border-gray-200 px-4 py-6 text-center text-gray-400 dark:border-gray-800">
            まだ口座がありません
          </li>
        )}
      </ul>
    </main>
  );
}
