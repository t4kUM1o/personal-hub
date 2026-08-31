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
    const closingDay = card.closingDay;
    const paymentDay = card.paymentDay;
    const offset = card.paymentMonthOffset ?? 1;

    let cycle;

    if (card.lastAutoPaymentAt) {
      // 通常運転: 前回処理済みの引き落とし日の翌日を起点に、次のサイクルを求める
      const referenceDate = new Date(card.lastAutoPaymentAt.getTime() + 24 * 60 * 60 * 1000);
      cycle = getCurrentBillingCycle(closingDay, paymentDay, offset, referenceDate);
    } else {
      // 初回(まだ一度も自動処理していない): 「今」開いているサイクルを起点に、
      // 支払日を迎えているサイクルが見つかるまで実際に1サイクルずつ遡って探す。
      // 日数の固定オフセットで遡ろうとすると、締め日次第で必要な遡り幅が変わってしまい、
      // 実際にこの方式で「1サイクル分ズレて処理される」不具合が発生したため、
      // 締め日の値に左右されない、確実な方式に変更した。
      cycle = getCurrentBillingCycle(closingDay, paymentDay, offset, now);
      let stepsBack = 0;
      while (cycle.paymentDate > now && stepsBack < 24) {
        const prevReferenceDate = new Date(cycle.cycleStart.getTime() - 24 * 60 * 60 * 1000);
        cycle = getCurrentBillingCycle(closingDay, paymentDay, offset, prevReferenceDate);
        stepsBack += 1;
      }
      if (cycle.paymentDate > now) {
        // 24回遡っても支払日を迎えたサイクルが見つからない = まだ引き落とし自体が発生していない
        continue;
      }
    }

    let iterations = 0;
    while (iterations < 24) {
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

      const nextReferenceDate = new Date(cycle.cycleEnd.getTime() + 24 * 60 * 60 * 1000);
      cycle = getCurrentBillingCycle(closingDay, paymentDay, offset, nextReferenceDate);
      iterations += 1;
    }
  }
}
