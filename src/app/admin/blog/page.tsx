import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deletePost } from "./actions";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";

export default async function AdminBlogPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, tags: { include: { tag: true } } },
  });

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ブログ管理</h1>
        <Link
          href="/admin/blog/new"
          className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          新規作成
        </Link>
      </div>

      <div className="mt-4 flex gap-4 text-sm">
        <Link href="/admin/blog/categories" className="text-accent hover:underline">
          カテゴリー管理
        </Link>
        <Link href="/admin/blog/tags" className="text-accent hover:underline">
          タグ管理
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-card border border-gray-200 dark:border-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2 font-medium">状態</th>
              <th className="px-4 py-2 font-medium">タイトル</th>
              <th className="px-4 py-2 font-medium">カテゴリ</th>
              <th className="px-4 py-2 font-medium">タグ</th>
              <th className="px-4 py-2 font-medium">更新日時</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-2">
                  <span
                    className={
                      post.status === "PUBLISHED"
                        ? "rounded-card bg-accent/10 px-2 py-0.5 text-xs text-accent"
                        : "rounded-card bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }
                  >
                    {post.status === "PUBLISHED" ? "公開中" : "下書き"}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{post.title}</td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                  {post.category?.name ?? "-"}
                </td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                  {post.tags.map((t) => t.tag.name).join(", ") || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-300">
                  {post.updatedAt.toLocaleString("ja-JP")}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  <div className="flex gap-3">
                    <Link href={`/admin/blog/${post.id}/edit`} className="text-accent hover:underline">
                      編集
                    </Link>
                    <form action={deletePost}>
                      <input type="hidden" name="id" value={post.id} />
                      <ConfirmSubmitButton
                        confirmMessage={`「${post.title}」を削除しますか？`}
                        className="text-red-600 hover:underline dark:text-red-400"
                      >
                        削除
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  まだ記事がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
