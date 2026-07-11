import Link from "next/link";
import { importTransactionsCsv } from "../actions";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ imported?: string; skipped?: string }>;
}) {
  const { imported, skipped } = await searchParams;
  const skippedCount = Number(skipped ?? 0);

  return (
    <main className="p-8">
      <Link href="/kakeibo" className="text-sm text-accent hover:underline">
        ← 家計簿に戻る
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">CSVインポート</h1>

      {imported !== undefined && (
        <p className="mt-4 rounded-card bg-accent/10 px-3 py-2 text-sm text-accent">
          {imported}件を取り込みました
          {skippedCount > 0 && `（${skippedCount}件は形式が不正、または口座名が一致せずスキップしました）`}
        </p>
      )}

      <div className="mt-4 rounded-card border border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
        <p>CSVの1行目はヘッダー行として扱われます。列は以下の通りです。</p>
        <p className="mt-2 font-mono text-xs">日付, 種別, 金額, 口座, カテゴリ, メモ</p>
        <ul className="mt-2 list-disc pl-5">
          <li>日付: YYYY-MM-DD形式</li>
          <li>種別: 「収入」または「支出」</li>
          <li>口座・カテゴリ: 事前に登録済みの名前と完全一致している必要があります（一致しない口座の行はスキップされます）</li>
        </ul>
        <p className="mt-2">
          エクスポートしたCSVと同じ形式なので、迷ったら一度エクスポートしてみるのが確実です。
        </p>
      </div>

      <form
        action={importTransactionsCsv}
        encType="multipart/form-data"
        className="mt-6 flex max-w-md flex-col gap-3"
      >
        <input type="file" name="file" accept=".csv,text/csv" required className="text-sm" />
        <button
          type="submit"
          className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          インポートする
        </button>
      </form>
    </main>
  );
}
