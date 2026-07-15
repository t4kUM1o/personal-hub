import "server-only";
import { prisma } from "@/lib/prisma";
import {
  getCurrentBillingCycle,
  getBillingCycleForMonth,
  type BillingCycle,
} from "./creditCardBilling";

export interface AccountBalanceInfo {
  id: string;
  name: string;
  type: string;
  // 現金・銀行・電子マネー用: 初期残高 + (基準日までの)収入 - 支出
  balance: number | null;
  // クレジットカード用
  billing: (BillingCycle & { total: number }) | null;
}

async function computeBalances(
  userId: string,
  getCycle: (closingDay: number, paymentDay: number, paymentMonthOffset: number) => BillingCycle,
  cashCutoffExclusiveEnd?: Date
): Promise<AccountBalanceInfo[]> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  const results: AccountBalanceInfo[] = [];

  for (const a of accounts) {
    if (a.type === "CREDIT_CARD") {
      let billing: (BillingCycle & { total: number }) | null = null;

      if (a.closingDay && a.paymentDay) {
        const cycle = getCycle(a.closingDay, a.paymentDay, a.paymentMonthOffset ?? 1);
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
      const dateFilter = cashCutoffExclusiveEnd ? { lt: cashCutoffExclusiveEnd } : undefined;
      const [incomeSum, expenseSum] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            accountId: a.id,
            type: "INCOME",
            ...(dateFilter ? { date: dateFilter } : {}),
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            accountId: a.id,
            type: "EXPENSE",
            ...(dateFilter ? { date: dateFilter } : {}),
          },
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

// 常に「今」基準（口座管理ページなど、月の概念が無い画面用）
export async function getAccountBalances(userId: string): Promise<AccountBalanceInfo[]> {
  return computeBalances(userId, getCurrentBillingCycle);
}

// 家計簿ページで表示中の月タブに連動させる版。
// クレジットカードは「その月を主な利用期間とするサイクル」の請求額・引き落とし予定日を返す
// (例: 締め日4日・翌月5日払いのカードなら、6月タブ→6/5-7/4利用分・8/5引き落とし)
export async function getAccountBalancesForMonth(
  userId: string,
  viewedYear: number,
  viewedMonth: number,
  monthExclusiveEnd: Date
): Promise<AccountBalanceInfo[]> {
  return computeBalances(
    userId,
    (closingDay, paymentDay, paymentMonthOffset) =>
      getBillingCycleForMonth(closingDay, paymentDay, paymentMonthOffset, viewedYear, viewedMonth),
    monthExclusiveEnd
  );
}
