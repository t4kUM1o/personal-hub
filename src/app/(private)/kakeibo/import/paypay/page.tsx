import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { importPayPayCsv } from "../../actions";
import { BackLink } from "@/components/ui/BackLink";

export const dynamic = "force-dynamic";

export default async function PayPayImportPage({
  searchParams,
}: {
  searchParams: Promise<{ imported?: string; skipped?: string; reasons?: string; error?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { imported, skipped, reasons, error } = await searchParams;
  const skippedCount = Number(skipped ?? 0);
  const reasonList = reasons ? reasons.split("|") : [];

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  return (
    <main className="p-8">
      <BackLink href="/kakeibo" label="家計簿に戻る" />
      <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        PayPay明細の取り込み
      </h1>

      {error && (
        <p className="mt-4 rounded-card bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      {imported !== undefined && (
        <div className="mt-4 rounded-card bg-accent/10 px-3 py-2 text-sm text-accent">
          {imported}件を取り込みました
          {skippedCount > 0 && `（${skippedCount}件はスキップしました）`}
        </div>
      )}

      {reasonList.length > 0 && (
        <div className="mt-2 rounded-card border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          <p className="font-medium">スキップした行の理由:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {reasonList.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 rounded-card border border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
        <p>PayPayのマイページからダウンロードできる利用明細CSVを、そのままアップロードできます。</p>
        <ul className="mt-2 list-disc pl-5">
          <li>全て「支出」として取り込まれます（カテゴリは未分類。後で個別に設定してください）</li>
          <li>店名・商品名はメモ欄に入ります</li>
          <li>金額が0円以下の行（キャンセル分など）は自動的にスキップされます</li>
          <li>文字コード（UTF-8 / Shift-JIS）は自動で判定します</li>
        </ul>
      </div>

      {accounts.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          先に{" "}
          <Link href="/kakeibo/accounts" className="text-accent hover:underline">
            口座管理
          </Link>{" "}
          から取り込み先の口座（例:「PayPayカード」）を1つ作成してください。
        </p>
      ) : (
        <form
          action={importPayPayCsv}
          encType="multipart/form-data"
          className="mt-6 flex max-w-md flex-col gap-3"
        >
          <label className="text-sm text-gray-600 dark:text-gray-400">
            取り込み先の口座
            <select
              name="accountId"
              required
              className="mt-1 w-full rounded-card border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <input type="file" name="file" accept=".csv,text/csv" required className="text-sm" />
          <button
            type="submit"
            className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            取り込む
          </button>
        </form>
      )}
    </main>
  );
}
