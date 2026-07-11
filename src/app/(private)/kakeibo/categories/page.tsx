import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { createCategory, deleteCategory } from "../actions";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";

// DBを見に行くページなので、ビルド時の静的生成ではなく常にリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

export default async function KakeiboCategoriesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const categories = await prisma.transactionCategory.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { transactions: true } } },
  });

  const expense = categories.filter((c) => c.type === "EXPENSE");
  const income = categories.filter((c) => c.type === "INCOME");

  return (
    <main className="p-8">
      <Link href="/kakeibo" className="text-sm text-accent hover:underline">
        ← 家計簿に戻る
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">カテゴリ管理</h1>

      <form action={createCategory} className="mt-6 flex max-w-md gap-2">
        <input
          type="text"
          name="name"
          required
          placeholder="カテゴリ名（例: 食費）"
          className="flex-1 rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900"
        />
        <select
          name="type"
          className="rounded-card border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="EXPENSE">支出</option>
          <option value="INCOME">収入</option>
        </select>
        <button
          type="submit"
          className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          追加
        </button>
      </form>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">支出カテゴリ</h2>
          <ul className="mt-2 divide-y divide-gray-100 rounded-card border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {expense.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {c.name} <span className="text-gray-400">({c._count.transactions}件)</span>
                </span>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmSubmitButton
                    confirmMessage={`「${c.name}」を削除しますか？`}
                    className="text-red-600 hover:underline dark:text-red-400"
                  >
                    削除
                  </ConfirmSubmitButton>
                </form>
              </li>
            ))}
            {expense.length === 0 && (
              <li className="px-4 py-6 text-center text-gray-400">まだありません</li>
            )}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">収入カテゴリ</h2>
          <ul className="mt-2 divide-y divide-gray-100 rounded-card border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {income.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {c.name} <span className="text-gray-400">({c._count.transactions}件)</span>
                </span>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmSubmitButton
                    confirmMessage={`「${c.name}」を削除しますか？`}
                    className="text-red-600 hover:underline dark:text-red-400"
                  >
                    削除
                  </ConfirmSubmitButton>
                </form>
              </li>
            ))}
            {income.length === 0 && (
              <li className="px-4 py-6 text-center text-gray-400">まだありません</li>
            )}
          </ul>
        </div>
      </div>
    </main>
  );
}
