import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentBillingCycle, type BillingCycle } from "./creditCardBilling";

export interface AccountBalanceInfo {
  id: string;
  name: string;
  type: string;
  // 現金・銀行・電子マネー用: 初期残高 + 全期間の収入 - 全期間の支出
  balance: number | null;
  // クレジットカード用: 締め日/引き落とし日が設定済みの場合のみ
  billing: (BillingCycle & { total: number }) | null;
}

export async function getAccountBalances(userId: string): Promise<AccountBalanceInfo[]> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  const results: AccountBalanceInfo[] = [];

  for (const a of accounts) {
    if (a.type === "CREDIT_CARD") {
      let billing: (BillingCycle & { total: number }) | null = null;

      if (a.closingDay && a.paymentDay) {
        const cycle = getCurrentBillingCycle(a.closingDay, a.paymentDay, a.paymentMonthOffset ?? 1);
        const sum = await prisma.transaction.aggregate({
          where: {
            accountId: a.id,
            type: "EXPENSE",
            date: { gte: cycle.cycleStart, lte: cycle.cycleEnd },
          },
          _sum: { amount: true },
        });
        billing = { ...cycle, total: sum._sum.amount ?? 0 };
      }

      results.push({ id: a.id, name: a.name, type: a.type, balance: null, billing });
    } else {
      const [incomeSum, expenseSum] = await Promise.all([
        prisma.transaction.aggregate({
          where: { accountId: a.id, type: "INCOME" },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { accountId: a.id, type: "EXPENSE" },
          _sum: { amount: true },
        }),
      ]);
      const balance =
        a.initialBalance + (incomeSum._sum.amount ?? 0) - (expenseSum._sum.amount ?? 0);
      results.push({ id: a.id, name: a.name, type: a.type, balance, billing: null });
    }
  }

  return results;
}
