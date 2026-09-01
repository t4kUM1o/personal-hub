"use client";

import { useRouter } from "next/navigation";

export function MonthPicker({
  value,
  label,
  filterQueryString,
}: {
  value: string;
  label: string;
  filterQueryString?: string;
}) {
  const router = useRouter();

  return (
    <label className="flex flex-col items-center text-lg font-semibold text-gray-800 dark:text-gray-200">
      <input
        type="month"
        value={value}
        onChange={(e) => {
          if (e.target.value) {
            const suffix = filterQueryString ? `&${filterQueryString}` : "";
            router.push(`/kakeibo?month=${e.target.value}${suffix}`);
          }
        }}
        aria-label="年月を選択"
        className="cursor-pointer border-none bg-transparent text-center text-lg font-semibold text-gray-800 outline-none dark:text-gray-200"
      />
      <span className="sr-only">{label}</span>
    </label>
  );
}
