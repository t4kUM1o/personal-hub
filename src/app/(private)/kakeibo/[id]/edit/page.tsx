import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { updateTransaction } from "../../actions";
import { TransactionForm } from "../../TransactionForm";
import { BackLink } from "@/components/ui/BackLink";

// DBを見に行くページなので、ビルド時の静的生成ではなく常にリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const [transaction, accounts, categories] = await Promise.all([
    prisma.transaction.findFirst({ where: { id, userId: user.id } }),
    prisma.account.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.transactionCategory.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);

  if (!transaction) {
    notFound();
  }

  return (
    <main className="p-8">
      <BackLink href="/kakeibo" label="家計簿に戻る" />
      <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">記録を編集</h1>
      <TransactionForm
        action={updateTransaction}
        accounts={accounts}
        categories={categories}
        submitLabel="更新する"
        transaction={transaction}
      />
    </main>
  );
}
