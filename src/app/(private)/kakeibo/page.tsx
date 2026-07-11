import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { deleteTransaction, deleteTransactions } from "./actions";
import { CategoryBreakdownChart, MonthlyTrendChart } from "./KakeiboCharts";
import { TransactionsTable } from "./TransactionsTable";
import { MonthPicker } from "./MonthPicker";

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
  const current = `${year}-${String(month).padStart(2, "0")}`;

  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);
  const prev = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const next = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;

  return { year, month, start, end, label, current, prev, next };
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
    return { month: `${monthNum}月`, key, 収入: v.income, 支出: v.expense };
  });
}

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

interface KakeiboSearchParams {
  month?: string;
  type?: string;
  accountId?: string;
  categoryId?: string;
  q?: string;
}

export default async function KakeiboPage({
  searchParams,
}: {
  searchParams: Promise<KakeiboSearchParams>;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const {
    month,
    type: typeFilter,
    accountId: accountIdFilter,
    categoryId: categoryIdFilter,
    q,
  } = await searchParams;
  const { year, month: monthNum, start, end, label, current, prev, next } = getMonthRange(month);

  const [accounts, categories, monthTransactions] = await Promise.all([
    prisma.account.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.transactionCategory.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      include: { budget: true },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: start, lt: end } },
      include: { account: true, category: true },
    }),
  ]);

  // フィルターは一覧表示だけに効かせる。合計カード・グラフは常に月全体の値のまま。
  const hasFilter = Boolean(typeFilter || accountIdFilter || categoryIdFilter || q);

  let filteredTransactions = [...monthTransactions].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  if (hasFilter) {
    const filterWhere: Prisma.TransactionWhereInput = {
      userId: user.id,
      date: { gte: start, lt: end },
    };
    if (typeFilter === "INCOME" || typeFilter === "EXPENSE") {
      filterWhere.type = typeFilter;
    }
    if (accountIdFilter) {
      filterWhere.accountId = accountIdFilter;
    }
    if (categoryIdFilter) {
      filterWhere.categoryId = categoryIdFilter;
    }
    if (q) {
      filterWhere.memo = { contains: q, mode: "insensitive" };
    }

    filteredTransactions = await prisma.transaction.findMany({
      where: filterWhere,
      orderBy: { date: "desc" },
      include: { account: true, category: true },
    });
  }

  const income = monthTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = monthTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryTotals = new Map<string, number>();
  const spentByCategoryId = new Map<string, number>();
  for (const t of monthTransactions) {
    if (t.type !== "EXPENSE") continue;
    const key = t.category?.name ?? "未分類";
    categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + t.amount);
    if (t.categoryId) {
      spentByCategoryId.set(t.categoryId, (spentByCategoryId.get(t.categoryId) ?? 0) + t.amount);
    }
  }
  const categoryBreakdown = Array.from(categoryTotals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const budgetedCategories = categories.filter((c) => c.type === "EXPENSE" && c.budget);
  const monthlyTrend = await getMonthlyTrend(user.id, year, monthNum);

  const exportParams = new URLSearchParams({ month: current });
  if (typeFilter) exportParams.set("type", typeFilter);
  if (accountIdFilter) exportParams.set("accountId", accountIdFilter);
  if (categoryIdFilter) exportParams.set("categoryId", categoryIdFilter);
  if (q) exportParams.set("q", q);

  const selectClass =
    "rounded-card border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900";

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

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/kakeibo/accounts" className="text-accent hover:underline">
          口座管理
        </Link>
        <Link href="/kakeibo/categories" className="text-accent hover:underline">
          カテゴリ管理
        </Link>
        <Link href="/kakeibo/import" className="text-accent hover:underline">
          CSVインポート
        </Link>
        <a href={`/api/kakeibo/export?${exportParams.toString()}`} className="text-accent hover:underline">
          CSVエクスポート
        </a>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Link
          href={`/kakeibo?month=${prev}`}
          className="text-sm text-gray-500 hover:underline dark:text-gray-400"
        >
          ← 前月
        </Link>
        <MonthPicker value={current} label={label} />
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

      {budgetedCategories.length > 0 && (
        <div className="mt-6 rounded-card border border-gray-200 p-4 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            予算の達成状況（{label}）
          </h3>
          <div className="mt-3 space-y-3">
            {budgetedCategories.map((c) => {
              const spent = spentByCategoryId.get(c.id) ?? 0;
              const budgetAmount = c.budget!.monthlyAmount;
              const percentage = Math.min(100, Math.round((spent / budgetAmount) * 100));
              const over = spent > budgetAmount;
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{c.name}</span>
                    <span className={over ? "font-medium text-red-600 dark:text-red-400" : ""}>
                      {yen(spent)} / {yen(budgetAmount)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-full ${over ? "bg-red-500" : "bg-accent"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      <form
        method="GET"
        className="mt-6 flex flex-wrap items-end gap-3 rounded-card border border-gray-200 p-4 dark:border-gray-800"
      >
        <input type="hidden" name="month" value={current} />
        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          種別
          <select name="type" defaultValue={typeFilter ?? ""} className={selectClass}>
            <option value="">すべて</option>
            <option value="INCOME">収入</option>
            <option value="EXPENSE">支出</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          口座
          <select name="accountId" defaultValue={accountIdFilter ?? ""} className={selectClass}>
            <option value="">すべて</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          カテゴリ
          <select name="categoryId" defaultValue={categoryIdFilter ?? ""} className={selectClass}>
            <option value="">すべて</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.type === "INCOME" ? "収入" : "支出"} / {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          メモ検索
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="キーワード"
            className={selectClass}
          />
        </label>
        <button
          type="submit"
          className="rounded-card bg-accent px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          絞り込む
        </button>
        {hasFilter && (
          <Link
            href={`/kakeibo?month=${current}`}
            className="text-sm text-gray-500 hover:underline dark:text-gray-400"
          >
            クリア
          </Link>
        )}
      </form>

      <div className="mt-4">
        <TransactionsTable
          transactions={filteredTransactions.map((t) => ({
            id: t.id,
            date: t.date.toISOString(),
            type: t.type,
            amount: t.amount,
            accountName: t.account.name,
            categoryName: t.category?.name ?? null,
            memo: t.memo,
          }))}
          deleteTransaction={deleteTransaction}
          deleteTransactions={deleteTransactions}
          emptyMessage={hasFilter ? "条件に一致する記録がありません" : "この月の記録はまだありません"}
        />
      </div>
    </main>
  );
}
