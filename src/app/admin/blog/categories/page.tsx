import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createCategory, deleteCategory } from "../actions";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return (
    <main className="p-8">
      <Link href="/admin/blog" className="text-sm text-accent hover:underline">
        ← ブログ管理に戻る
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">カテゴリー管理</h1>

      <form action={createCategory} className="mt-6 flex max-w-md gap-2">
        <input
          type="text"
          name="name"
          required
          placeholder="新しいカテゴリ名"
          className="flex-1 rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900"
        />
        <button
          type="submit"
          className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          追加
        </button>
      </form>

      <ul className="mt-6 max-w-md divide-y divide-gray-100 rounded-card border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              {c.name} <span className="text-gray-400">({c._count.posts}件)</span>
            </span>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={c.id} />
              <ConfirmSubmitButton
                confirmMessage={`「${c.name}」を削除しますか？（該当記事は未分類になります）`}
                className="text-red-600 hover:underline dark:text-red-400"
              >
                削除
              </ConfirmSubmitButton>
            </form>
          </li>
        ))}
        {categories.length === 0 && (
          <li className="px-4 py-6 text-center text-gray-400">まだカテゴリがありません</li>
        )}
      </ul>
    </main>
  );
}
