import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { createTransaction } from "../actions";
import { TransactionForm } from "../TransactionForm";
import { BackLink } from "@/components/ui/BackLink";

// DBを見に行くページなので、ビルド時の静的生成ではなく常にリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

export default async function NewTransactionPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.transactionCategory.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="p-8">
      <BackLink href="/kakeibo" label="家計簿に戻る" />
      <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">記録を追加</h1>
      {accounts.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          先に{" "}
          <a href="/kakeibo/accounts" className="text-accent hover:underline">
            口座管理
          </a>{" "}
          から口座を1つ作成してください。
        </p>
      ) : (
        <TransactionForm
          action={createTransaction}
          accounts={accounts}
          categories={categories}
          submitLabel="記録する"
        />
      )}
    </main>
  );
}
