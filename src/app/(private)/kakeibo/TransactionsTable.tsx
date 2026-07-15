"use client";

import { useState } from "react";
import Link from "next/link";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";

export interface TransactionRow {
  id: string;
  date: string; // ISO文字列
  type: "INCOME" | "EXPENSE";
  amount: number;
  accountName: string;
  categoryName: string | null;
  memo: string | null;
  isTransfer: boolean;
}

interface TransactionsTableProps {
  transactions: TransactionRow[];
  deleteTransaction: (formData: FormData) => void | Promise<void>;
  deleteTransactions: (formData: FormData) => void | Promise<void>;
  emptyMessage: string;
}

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export function TransactionsTable({
  transactions,
  deleteTransaction,
  deleteTransactions,
  emptyMessage,
}: TransactionsTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allChecked = transactions.length > 0 && selected.size === transactions.length;

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(transactions.map((t) => t.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div>
      {selected.size > 0 && (
        <form
          action={deleteTransactions}
          onSubmit={(e) => {
            if (!confirm(`選択した${selected.size}件を削除しますか？`)) {
              e.preventDefault();
            }
          }}
          className="mb-3 flex items-center gap-3 rounded-card bg-accent/10 px-4 py-2 text-sm"
        >
          {Array.from(selected).map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}
          <span className="text-accent">{selected.size}件選択中</span>
          <button
            type="submit"
            className="rounded-card bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700"
          >
            選択した項目を削除
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-xs text-gray-500 hover:underline dark:text-gray-400"
          >
            選択解除
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-card border border-gray-200 dark:border-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="w-8 px-4 py-2">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label="全て選択"
                />
              </th>
              <th className="px-4 py-2 font-medium">日付</th>
              <th className="px-4 py-2 font-medium">種別</th>
              <th className="px-4 py-2 font-medium">金額</th>
              <th className="px-4 py-2 font-medium">口座</th>
              <th className="px-4 py-2 font-medium">カテゴリ</th>
              <th className="px-4 py-2 font-medium">メモ</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggleOne(t.id)}
                    aria-label="選択"
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-300">
                  {new Date(t.date).toLocaleDateString("ja-JP")}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={
                      t.isTransfer
                        ? "rounded-card bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                        : t.type === "INCOME"
                          ? "rounded-card bg-accent/10 px-2 py-0.5 text-xs text-accent"
                          : "rounded-card bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }
                  >
                    {t.isTransfer ? "振替" : t.type === "INCOME" ? "収入" : "支出"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-800 dark:text-gray-200">
                  {yen(t.amount)}
                </td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{t.accountName}</td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                  {t.categoryName ?? "-"}
                </td>
                <td
                  className="max-w-xs truncate px-4 py-2 text-gray-600 dark:text-gray-300"
                  title={t.memo ?? undefined}
                >
                  {t.memo ?? "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  <div className="flex gap-3">
                    <Link href={`/kakeibo/${t.id}/edit`} className="text-accent hover:underline">
                      編集
                    </Link>
                    <form action={deleteTransaction}>
                      <input type="hidden" name="id" value={t.id} />
                      <ConfirmSubmitButton
                        confirmMessage="この記録を削除しますか？"
                        className="text-red-600 hover:underline dark:text-red-400"
                      >
                        削除
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
