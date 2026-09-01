"use client";

import { useState } from "react";
import { updateSubscription, toggleSubscriptionActive, deleteSubscription } from "../actions";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

function toDateInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

interface SubscriptionData {
  id: string;
  name: string;
  amount: number;
  interval: "MONTHLY" | "YEARLY";
  nextBillingAt: string; // ISO文字列
  active: boolean;
  memo: string | null;
  accountId: string;
  accountName: string;
  categoryId: string | null;
}

interface Option {
  id: string;
  name: string;
}

export function SubscriptionRow({
  subscription: s,
  accounts,
  categories,
}: {
  subscription: SubscriptionData;
  accounts: Option[];
  categories: Option[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const inputClass =
    "w-full rounded-card border border-gray-300 px-2 py-1.5 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900";

  if (isEditing) {
    return (
      <li className="rounded-card border border-accent/30 bg-accent/5 px-4 py-3 text-sm dark:bg-accent/10">
        <form
          action={async (formData) => {
            await updateSubscription(formData);
            setIsEditing(false);
          }}
          className="space-y-2"
        >
          <input type="hidden" name="id" value={s.id} />
          <input type="text" name="name" required defaultValue={s.name} className={inputClass} />
          <div className="flex gap-2">
            <input
              type="number"
              name="amount"
              required
              min={1}
              defaultValue={s.amount}
              className={`${inputClass} w-24`}
            />
            <select name="interval" defaultValue={s.interval} className={inputClass}>
              <option value="MONTHLY">毎月</option>
              <option value="YEARLY">毎年</option>
            </select>
          </div>
          <label className="block text-xs text-gray-500 dark:text-gray-400">
            次回請求日
            <input
              type="date"
              name="nextBillingAt"
              required
              defaultValue={toDateInputValue(new Date(s.nextBillingAt))}
              className={`mt-0.5 ${inputClass}`}
            />
          </label>
          <select name="accountId" required defaultValue={s.accountId} className={inputClass}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select name="categoryId" defaultValue={s.categoryId ?? ""} className={inputClass}>
            <option value="">未分類</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="memo"
            placeholder="メモ（任意）"
            defaultValue={s.memo ?? ""}
            className={inputClass}
          />
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="rounded-card bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-card border border-gray-300 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
            >
              キャンセル
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      className={`rounded-card border px-4 py-3 text-sm ${
        s.active
          ? "border-gray-200 dark:border-gray-800"
          : "border-gray-100 opacity-60 dark:border-gray-900"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-gray-700 dark:text-gray-300">
          {s.name}{" "}
          <span className="text-gray-400">
            （{yen(s.amount)} / {s.interval === "MONTHLY" ? "毎月" : "毎年"}・{s.accountName}）
          </span>
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-accent hover:underline"
          >
            編集
          </button>
          <form action={toggleSubscriptionActive}>
            <input type="hidden" name="id" value={s.id} />
            <button type="submit" className="text-xs text-gray-500 hover:underline dark:text-gray-400">
              {s.active ? "一時停止" : "再開"}
            </button>
          </form>
          <form action={deleteSubscription}>
            <input type="hidden" name="id" value={s.id} />
            <ConfirmSubmitButton
              confirmMessage={`「${s.name}」を削除しますか？`}
              className="text-xs text-red-600 hover:underline dark:text-red-400"
            >
              削除
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        次回請求日: {new Date(s.nextBillingAt).toLocaleDateString("ja-JP")}
        {!s.active && "（一時停止中）"}
      </p>
    </li>
  );
}
