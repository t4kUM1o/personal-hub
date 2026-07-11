import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { UserRow } from "./UserRow";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const currentUser = await getSessionUser();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ユーザー管理</h1>
      <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-gray-400">
        新しいユーザーの追加は、VM上でシードスクリプト（`node prisma/seed.cjs`）を実行する形になります。
        公開の会員登録フォームは意図的に用意していません。
      </p>

      <div className="mt-6 overflow-x-auto rounded-card border border-gray-200 dark:border-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2 font-medium">メールアドレス</th>
              <th className="px-4 py-2 font-medium">権限</th>
              <th className="px-4 py-2 font-medium">登録日</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={{
                  id: u.id,
                  email: u.email,
                  role: u.role,
                  createdAt: u.createdAt.toISOString(),
                }}
                isSelf={u.id === currentUser?.id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
