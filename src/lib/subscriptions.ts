import "server-only";
import { prisma } from "@/lib/prisma";

export function addSubscriptionInterval(
  date: Date,
  interval: "MONTHLY" | "YEARLY",
  billingDay: number
): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (interval === "MONTHLY") {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const daysInMonth = new Date(nextYear, nextMonth, 0).getDate();
    return new Date(nextYear, nextMonth - 1, Math.min(billingDay, daysInMonth));
  }

  const daysInMonth = new Date(year + 1, month, 0).getDate();
  return new Date(year + 1, month - 1, Math.min(billingDay, daysInMonth));
}

// 次回請求日を過ぎているサブスクを見つけ、その分の取引を作成して次回請求日を繰り上げる。
// 専用のcronジョブは用意せず、家計簿ページへのアクセスをトリガーにする簡易的な方式
// (予約投稿の自動公開と同じ考え方)。
export async function processDueSubscriptions(userId: string): Promise<void> {
  const now = new Date();

  const dueSubscriptions = await prisma.subscription.findMany({
    where: { userId, active: true, nextBillingAt: { lte: now } },
  });

  for (const sub of dueSubscriptions) {
    let nextBillingAt = sub.nextBillingAt;
    const billingDates: Date[] = [];

    // 何ヶ月もアクセスが無かった場合に備え、追いつくまで繰り返す(念のため上限を設ける)
    let iterations = 0;
    while (nextBillingAt <= now && iterations < 24) {
      billingDates.push(nextBillingAt);
      nextBillingAt = addSubscriptionInterval(nextBillingAt, sub.interval, sub.billingDay);
      iterations += 1;
    }

    if (billingDates.length === 0) continue;

    await prisma.$transaction([
      ...billingDates.map((date) =>
        prisma.transaction.create({
          data: {
            userId,
            type: "EXPENSE",
            amount: sub.amount,
            date,
            accountId: sub.accountId,
            categoryId: sub.categoryId,
            memo: `[サブスク] ${sub.name}`,
          },
        })
      ),
      prisma.subscription.update({
        where: { id: sub.id },
        data: { nextBillingAt },
      }),
    ]);
  }
}
