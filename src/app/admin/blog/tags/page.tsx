import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createTag, deleteTag } from "../actions";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";

export default async function AdminTagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return (
    <main className="p-8">
      <Link href="/admin/blog" className="text-sm text-accent hover:underline">
        ← ブログ管理に戻る
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">タグ管理</h1>

      <form action={createTag} className="mt-6 flex max-w-md gap-2">
        <input
          type="text"
          name="name"
          required
          placeholder="新しいタグ名"
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
        {tags.map((t) => (
          <li key={t.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              #{t.name} <span className="text-gray-400">({t._count.posts}件)</span>
            </span>
            <form action={deleteTag}>
              <input type="hidden" name="id" value={t.id} />
              <ConfirmSubmitButton
                confirmMessage={`「${t.name}」を削除しますか？`}
                className="text-red-600 hover:underline dark:text-red-400"
              >
                削除
              </ConfirmSubmitButton>
            </form>
          </li>
        ))}
        {tags.length === 0 && (
          <li className="px-4 py-6 text-center text-gray-400">まだタグがありません</li>
        )}
      </ul>
    </main>
  );
}
