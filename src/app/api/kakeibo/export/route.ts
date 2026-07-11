import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month");
  const type = searchParams.get("type");
  const accountId = searchParams.get("accountId");
  const categoryId = searchParams.get("categoryId");
  const q = searchParams.get("q");

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [yearStr, monthStr] = (month || defaultMonth).split("-");
  const year = Number(yearStr) || now.getFullYear();
  const monthNum = Number(monthStr) || now.getMonth() + 1;
  const start = new Date(year, monthNum - 1, 1);
  const end = new Date(year, monthNum, 1);

  const where: Prisma.TransactionWhereInput = {
    userId: user.id,
    date: { gte: start, lt: end },
  };
  if (type === "INCOME" || type === "EXPENSE") {
    where.type = type;
  }
  if (accountId) {
    where.accountId = accountId;
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (q) {
    where.memo = { contains: q, mode: "insensitive" };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: { account: true, category: true },
  });

  const rows = transactions.map((t) => ({
    日付: t.date.toISOString().slice(0, 10),
    種別: t.type === "INCOME" ? "収入" : "支出",
    金額: t.amount,
    口座: t.account.name,
    カテゴリ: t.category?.name ?? "",
    メモ: t.memo ?? "",
  }));

  const csv = Papa.unparse(rows);
  // ExcelでBOM無しCSVを開くと日本語ヘッダーが文字化けするため付与する
  const bom = "\uFEFF";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kakeibo-${String(year)}-${String(monthNum).padStart(2, "0")}.csv"`,
    },
  });
}
