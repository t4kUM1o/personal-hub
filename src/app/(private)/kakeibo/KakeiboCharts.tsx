"use client";

import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
} from "recharts";

function formatYen(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  return `¥${(Number.isFinite(n) ? n : 0).toLocaleString("ja-JP")}`;
}

const COLORS = [
  "#2563eb",
  "#f97316",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#ca8a04",
  "#db2777",
];

interface CategoryBreakdownItem {
  name: string;
  value: number;
}

export function CategoryBreakdownChart({ data }: { data: CategoryBreakdownItem[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-[260px] items-center justify-center text-sm text-gray-400">
        この月の支出データがありません
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          outerRadius={90}
          label={(props: { name?: string }) => props.name ?? ""}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={formatYen} />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface MonthlyTrendItem {
  month: string; // 表示用ラベル (例: "7月")
  key: string; // 遷移先 "YYYY-MM"
  収入: number;
  支出: number;
}

export function MonthlyTrendChart({ data }: { data: MonthlyTrendItem[] }) {
  const router = useRouter();

  function handleDoubleClick(bar: { payload?: MonthlyTrendItem }) {
    const key = bar?.payload?.key;
    if (key) {
      router.push(`/kakeibo?month=${key}`);
    }
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis
          fontSize={12}
          tickFormatter={(v: unknown) => `${Math.round(Number(v) / 1000)}k`}
        />
        <Tooltip formatter={formatYen} />
        <Legend />
        <Bar
          dataKey="収入"
          fill="#2563eb"
          radius={[4, 4, 0, 0]}
          onDoubleClick={handleDoubleClick}
          style={{ cursor: "pointer" }}
        />
        <Bar
          dataKey="支出"
          fill="#f97316"
          radius={[4, 4, 0, 0]}
          onDoubleClick={handleDoubleClick}
          style={{ cursor: "pointer" }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
