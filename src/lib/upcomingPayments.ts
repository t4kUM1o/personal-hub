import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentBillingCycle } from "./creditCardBilling";

export interface UpcomingPayment {
  date: Date;
  label: string;
  amount: number;
  type: "credit_card" | "subscription";
}

export async function getUpcomingPayments(userId: string): Promise<UpcomingPayment[]> {
  const [creditCardAccounts, subscriptions] = await Promise.all([
    prisma.account.findMany({ where: { userId, type: "CREDIT_CARD" } }),
    prisma.subscription.findMany({
      where: { userId, active: true },
      include: { account: true },
    }),
  ]);

  const items: UpcomingPayment[] = [];

  for (const a of creditCardAccounts) {
    if (!a.closingDay || !a.paymentDay) continue;

    const cycle = getCurrentBillingCycle(a.closingDay, a.paymentDay, a.paymentMonthOffset ?? 1);
    const sum = await prisma.transaction.aggregate({
      where: {
        accountId: a.id,
        type: "EXPENSE",
        date: { gte: cycle.cycleStart, lte: cycle.cycleEnd },
      },
      _sum: { amount: true },
    });
    const total = sum._sum.amount ?? 0;

    if (total > 0) {
      items.push({
        date: cycle.paymentDate,
        label: `${a.name} の引き落とし`,
        amount: total,
        type: "credit_card",
      });
    }
  }

  for (const s of subscriptions) {
    items.push({
      date: s.nextBillingAt,
      label: `${s.name}（${s.account.name}）`,
      amount: s.amount,
      type: "subscription",
    });
  }

  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
}
