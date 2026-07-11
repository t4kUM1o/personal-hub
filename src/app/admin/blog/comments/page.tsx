import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { approveComment, deleteComment } from "../actions";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";

export default async function AdminCommentsPage() {
  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: { post: { select: { title: true, slug: true } } },
  });

  return (
    <main className="p-8">
      <Link href="/admin/blog" className="text-sm text-accent hover:underline">
        ← ブログ管理に戻る
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">コメント管理</h1>

      <div className="mt-6 overflow-x-auto rounded-card border border-gray-200 dark:border-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2 font-medium">状態</th>
              <th className="px-4 py-2 font-medium">記事</th>
              <th className="px-4 py-2 font-medium">投稿者</th>
              <th className="px-4 py-2 font-medium">内容</th>
              <th className="px-4 py-2 font-medium">日時</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {comments.map((c) => (
              <tr key={c.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-2">
                  <span
                    className={
                      c.approved
                        ? "rounded-card bg-accent/10 px-2 py-0.5 text-xs text-accent"
                        : "rounded-card bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400"
                    }
                  >
                    {c.approved ? "承認済み" : "未承認"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <Link href={`/blog/${c.post.slug}`} className="text-accent hover:underline">
                    {c.post.title}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{c.authorName}</td>
                <td
                  className="max-w-xs truncate px-4 py-2 text-gray-600 dark:text-gray-300"
                  title={c.body}
                >
                  {c.body}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-300">
                  {c.createdAt.toLocaleString("ja-JP")}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  <div className="flex gap-3">
                    {!c.approved && (
                      <form action={approveComment}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="text-accent hover:underline">
                          承認
                        </button>
                      </form>
                    )}
                    <form action={deleteComment}>
                      <input type="hidden" name="id" value={c.id} />
                      <ConfirmSubmitButton
                        confirmMessage="このコメントを削除しますか？"
                        className="text-red-600 hover:underline dark:text-red-400"
                      >
                        削除
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {comments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  コメントはまだありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
