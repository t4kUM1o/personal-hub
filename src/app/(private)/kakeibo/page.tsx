import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { deleteTransaction } from "./actions";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";

// DBを見に行くページなので、ビルド時の静的生成ではなく常にリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

function getMonthRange(monthParam?: string) {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [yearStr, monthStr] = (monthParam || defaultMonth).split("-");
  const year = Number(yearStr) || now.getFullYear();
  const month = Number(monthStr) || now.getMonth() + 1;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const label = `${year}年${month}月`;

  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);
  const prev = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const next = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;

  return { start, end, label, prev, next };
}

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export default async function KakeiboPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { month } = await searchParams;
  const { start, end, label, prev, next } = getMonthRange(month);

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id, date: { gte: start, lt: end } },
    orderBy: { date: "desc" },
    include: { account: true, category: true },
  });

  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">家計簿</h1>
        <Link
          href="/kakeibo/new"
          className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          記録を追加
        </Link>
      </div>

      <div className="mt-4 flex gap-4 text-sm">
        <Link href="/kakeibo/accounts" className="text-accent hover:underline">
          口座管理
        </Link>
        <Link href="/kakeibo/categories" className="text-accent hover:underline">
          カテゴリ管理
        </Link>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Link
          href={`/kakeibo?month=${prev}`}
          className="text-sm text-gray-500 hover:underline dark:text-gray-400"
        >
          ← 前月
        </Link>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{label}</h2>
        <Link
          href={`/kakeibo?month=${next}`}
          className="text-sm text-gray-500 hover:underline dark:text-gray-400"
        >
          翌月 →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-card border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">収入</p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{yen(income)}</p>
        </div>
        <div className="rounded-card border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">支出</p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{yen(expense)}</p>
        </div>
        <div className="rounded-card border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">差額</p>
          <p
            className={`mt-1 text-lg font-semibold ${
              income - expense >= 0 ? "text-accent" : "text-red-600 dark:text-red-400"
            }`}
          >
            {yen(income - expense)}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-card border border-gray-200 dark:border-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2 font-medium">日付</th>
              <th className="px-4 py-2 font-medium">種別</th>
              <th className="px-4 py-2 font-medium">金額</th>
              <th className="px-4 py-2 font-medium">口座</th>
              <th className="px-4 py-2 font-medium">カテゴリ</th>
              <th className="px-4 py-2 font-medium">メモ</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-300">
                  {t.date.toLocaleDateString("ja-JP")}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={
                      t.type === "INCOME"
                        ? "rounded-card bg-accent/10 px-2 py-0.5 text-xs text-accent"
                        : "rounded-card bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }
                  >
                    {t.type === "INCOME" ? "収入" : "支出"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-800 dark:text-gray-200">
                  {yen(t.amount)}
                </td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{t.account.name}</td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                  {t.category?.name ?? "-"}
                </td>
                <td
                  className="max-w-xs truncate px-4 py-2 text-gray-600 dark:text-gray-300"
                  title={t.memo ?? undefined}
                >
                  {t.memo ?? "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  <div className="flex gap-3">
                    <Link href={`/kakeibo/${t.id}/edit`} className="text-accent hover:underline">
                      編集
                    </Link>
                    <form action={deleteTransaction}>
                      <input type="hidden" name="id" value={t.id} />
                      <ConfirmSubmitButton
                        confirmMessage="この記録を削除しますか？"
                        className="text-red-600 hover:underline dark:text-red-400"
                      >
                        削除
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  この月の記録はまだありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
