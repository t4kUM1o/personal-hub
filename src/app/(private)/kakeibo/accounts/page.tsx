import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { createAccount, deleteAccount } from "../actions";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";

// DBを見に行くページなので、ビルド時の静的生成ではなく常にリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  CASH: "現金",
  BANK: "銀行",
  CREDIT_CARD: "クレジットカード",
  E_MONEY: "電子マネー",
};

export default async function AccountsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { transactions: true } } },
  });

  return (
    <main className="p-8">
      <Link href="/kakeibo" className="text-sm text-accent hover:underline">
        ← 家計簿に戻る
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">口座管理</h1>

      <form action={createAccount} className="mt-6 flex max-w-md gap-2">
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
        <button
          type="submit"
          className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          追加
        </button>
      </form>

      <ul className="mt-6 max-w-md divide-y divide-gray-100 rounded-card border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
        {accounts.map((a) => (
          <li key={a.id} className="flex items-center justify-between px-4 py-2 text-sm">
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
          </li>
        ))}
        {accounts.length === 0 && (
          <li className="px-4 py-6 text-center text-gray-400">まだ口座がありません</li>
        )}
      </ul>
    </main>
  );
}
