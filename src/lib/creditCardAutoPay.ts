import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentBillingCycle } from "./creditCardBilling";

// カードの引き落とし日が来ていれば、支払い元口座から自動で「振替」を作る。
// 専用のcronジョブは用意せず、家計簿ページへのアクセスをトリガーにする簡易的な方式
// (予約投稿・サブスクの自動処理と同じ考え方)。
//
// 「振替」として記録するのは、カードでの買い物自体は購入した時点で既に支出として
// 計上されているため、引き落とし時にもう一度支出扱いにすると二重計上になってしまうため。
// 支払い元口座からは実際にお金が減り、カード側は使った分が精算された扱い(収入計上)になる。
export async function processDueCreditCardPayments(userId: string): Promise<void> {
  const now = new Date();

  const cards = await prisma.account.findMany({
    where: {
      userId,
      type: "CREDIT_CARD",
      closingDay: { not: null },
      paymentDay: { not: null },
      paymentAccountId: { not: null },
    },
  });

  for (const card of cards) {
    if (!card.closingDay || !card.paymentDay || !card.paymentAccountId) continue;

    // 初回(まだ一度も自動処理していない)は「今」から見て直近のサイクルだけを対象にする。
    // 過去の全履歴を遡って大量の振替を作らないようにするため。
    let referenceDate = card.lastAutoPaymentAt
      ? new Date(card.lastAutoPaymentAt.getTime() + 24 * 60 * 60 * 1000)
      : now;

    let iterations = 0;
    while (iterations < 24) {
      const cycle = getCurrentBillingCycle(
        card.closingDay,
        card.paymentDay,
        card.paymentMonthOffset ?? 1,
        referenceDate
      );

      if (cycle.paymentDate > now) break;

      const sum = await prisma.transaction.aggregate({
        where: {
          accountId: card.id,
          type: "EXPENSE",
          date: { gte: cycle.cycleStart, lte: cycle.cycleEnd },
        },
        _sum: { amount: true },
      });
      const total = sum._sum.amount ?? 0;

      if (total > 0) {
        const transferGroupId = `cardpay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        await prisma.$transaction([
          prisma.transaction.create({
            data: {
              userId,
              type: "EXPENSE",
              amount: total,
              date: cycle.paymentDate,
              accountId: card.paymentAccountId,
              transferGroupId,
              memo: `${card.name} の引き落とし`,
            },
          }),
          prisma.transaction.create({
            data: {
              userId,
              type: "INCOME",
              amount: total,
              date: cycle.paymentDate,
              accountId: card.id,
              transferGroupId,
              memo: "カード利用分の精算",
            },
          }),
        ]);
      }

      await prisma.account.update({
        where: { id: card.id },
        data: { lastAutoPaymentAt: cycle.paymentDate },
      });

      referenceDate = new Date(cycle.cycleEnd.getTime() + 24 * 60 * 60 * 1000);
      iterations += 1;
    }
  }
}
