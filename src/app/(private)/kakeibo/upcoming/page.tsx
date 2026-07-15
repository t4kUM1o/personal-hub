import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUpcomingPayments } from "@/lib/upcomingPayments";
import { BackLink } from "@/components/ui/BackLink";

export const dynamic = "force-dynamic";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export default async function UpcomingPaymentsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const items = await getUpcomingPayments(user.id);

  return (
    <main className="p-8">
      <BackLink href="/kakeibo" label="家計簿に戻る" />
      <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        引き落とし・支払い予定
      </h1>
      <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
        クレジットカードの次回引き落としと、有効なサブスクの次回請求日をまとめて表示します。
      </p>

      <ul className="mt-6 max-w-md divide-y divide-gray-100 rounded-card border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
        {items.map((item, i) => (
          <li key={i} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="text-gray-800 dark:text-gray-200">{item.label}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {item.date.toLocaleDateString("ja-JP", {
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })}
                <span
                  className={
                    item.type === "credit_card"
                      ? "ml-2 rounded-card bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      : "ml-2 rounded-card bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                  }
                >
                  {item.type === "credit_card" ? "カード引き落とし" : "サブスク"}
                </span>
              </p>
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {yen(item.amount)}
            </span>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-4 py-6 text-center text-gray-400">
            表示できる予定はまだありません
          </li>
        )}
      </ul>
    </main>
  );
}
