import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { deleteTransaction } from "./actions";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { CategoryBreakdownChart, MonthlyTrendChart } from "./KakeiboCharts";

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

  return { year, month, start, end, label, prev, next };
}

async function getMonthlyTrend(userId: string, endYear: number, endMonth: number, monthsBack = 6) {
  const rangeStart = new Date(endYear, endMonth - monthsBack, 1);
  const rangeEnd = new Date(endYear, endMonth, 1);

  const rows = await prisma.transaction.findMany({
    where: { userId, date: { gte: rangeStart, lt: rangeEnd } },
    select: { type: true, amount: true, date: true },
  });

  const buckets = new Map<string, { income: number; expense: number }>();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(endYear, endMonth - 1 - i, 1);
    buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, {
      income: 0,
      expense: 0,
    });
  }

  for (const t of rows) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (t.type === "INCOME") {
      bucket.income += t.amount;
    } else {
      bucket.expense += t.amount;
    }
  }

  return Array.from(buckets.entries()).map(([key, v]) => {
    const monthNum = Number(key.split("-")[1]);
    return { month: `${monthNum}月`, 収入: v.income, 支出: v.expense };
  });
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
  const { year, month: monthNum, start, end, label, prev, next } = getMonthRange(month);

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

  const categoryTotals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    const key = t.category?.name ?? "未分類";
    categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + t.amount);
  }
  const categoryBreakdown = Array.from(categoryTotals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const monthlyTrend = await getMonthlyTrend(user.id, year, monthNum);

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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-gray-200 p-4 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            カテゴリ別支出（{label}）
          </h3>
          <div className="mt-2">
            <CategoryBreakdownChart data={categoryBreakdown} />
          </div>
        </div>
        <div className="rounded-card border border-gray-200 p-4 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            収支推移（直近6ヶ月）
          </h3>
          <div className="mt-2">
            <MonthlyTrendChart data={monthlyTrend} />
          </div>
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
