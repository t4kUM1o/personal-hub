import type { Account, TransactionCategory, Transaction } from "@prisma/client";

interface TransactionFormProps {
  action: (formData: FormData) => void | Promise<void>;
  accounts: Account[];
  categories: TransactionCategory[];
  submitLabel: string;
  transaction?: Transaction;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function TransactionForm({
  action,
  accounts,
  categories,
  submitLabel,
  transaction,
}: TransactionFormProps) {
  const inputClass =
    "mt-1 w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900";
  const defaultType = transaction?.type ?? "EXPENSE";

  return (
    <form action={action} className="mt-6 max-w-md space-y-5">
      {transaction && <input type="hidden" name="id" value={transaction.id} />}

      <fieldset className="text-sm text-gray-600 dark:text-gray-400">
        <legend className="mb-1">種別</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5">
            <input type="radio" name="type" value="EXPENSE" defaultChecked={defaultType === "EXPENSE"} />
            支出
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="type" value="INCOME" defaultChecked={defaultType === "INCOME"} />
            収入
          </label>
        </div>
      </fieldset>

      <label className="block text-sm text-gray-600 dark:text-gray-400">
        金額（円）
        <input
          type="number"
          name="amount"
          min={1}
          step={1}
          required
          defaultValue={transaction?.amount}
          className={inputClass}
        />
      </label>

      <label className="block text-sm text-gray-600 dark:text-gray-400">
        日付
        <input
          type="date"
          name="date"
          required
          defaultValue={transaction ? toDateInputValue(transaction.date) : toDateInputValue(new Date())}
          className={inputClass}
        />
      </label>

      <label className="block text-sm text-gray-600 dark:text-gray-400">
        口座
        <select name="accountId" required defaultValue={transaction?.accountId ?? ""} className={inputClass}>
          <option value="" disabled>
            選択してください
          </option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm text-gray-600 dark:text-gray-400">
        カテゴリ
        <select name="categoryId" defaultValue={transaction?.categoryId ?? ""} className={inputClass}>
          <option value="">未分類</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.type === "INCOME" ? "収入" : "支出"} / {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm text-gray-600 dark:text-gray-400">
        メモ
        <input type="text" name="memo" defaultValue={transaction?.memo ?? ""} className={inputClass} />
      </label>

      <button
        type="submit"
        className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        {submitLabel}
      </button>
    </form>
  );
}
