"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

function parseAmount(value: FormDataEntryValue | null): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("金額は1円以上の数値で入力してください");
  }
  return Math.round(n);
}

export async function createTransaction(formData: FormData) {
  const user = await requireUser();

  const type = formData.get("type") === "INCOME" ? "INCOME" : "EXPENSE";
  const amount = parseAmount(formData.get("amount"));
  const dateStr = String(formData.get("date") ?? "");
  const accountId = String(formData.get("accountId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const memo = String(formData.get("memo") ?? "").trim() || null;

  if (!dateStr || !accountId) {
    throw new Error("日付と口座は必須です");
  }

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type,
      amount,
      date: new Date(dateStr),
      accountId,
      categoryId,
      memo,
    },
  });

  revalidatePath("/kakeibo");
  redirect("/kakeibo");
}

export async function updateTransaction(formData: FormData) {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "");
  const type = formData.get("type") === "INCOME" ? "INCOME" : "EXPENSE";
  const amount = parseAmount(formData.get("amount"));
  const dateStr = String(formData.get("date") ?? "");
  const accountId = String(formData.get("accountId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const memo = String(formData.get("memo") ?? "").trim() || null;

  if (!id || !dateStr || !accountId) {
    throw new Error("不正なリクエストです");
  }

  // 自分の取引だけを更新できるようにする(他人のIDを渡されても書き換わらない)
  const result = await prisma.transaction.updateMany({
    where: { id, userId: user.id },
    data: { type, amount, date: new Date(dateStr), accountId, categoryId, memo },
  });

  if (result.count === 0) {
    throw new Error("対象の取引が見つかりません");
  }

  revalidatePath("/kakeibo");
  redirect("/kakeibo");
}

export async function deleteTransaction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.transaction.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/kakeibo");
}

export async function deleteTransactions(formData: FormData) {
  const user = await requireUser();
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  if (ids.length === 0) return;

  await prisma.transaction.deleteMany({ where: { id: { in: ids }, userId: user.id } });
  revalidatePath("/kakeibo");
}

const ACCOUNT_TYPES = ["CASH", "BANK", "CREDIT_CARD", "E_MONEY"] as const;

export async function createAccount(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "CASH");

  if (!name || !ACCOUNT_TYPES.includes(type as (typeof ACCOUNT_TYPES)[number])) {
    throw new Error("入力内容を確認してください");
  }

  await prisma.account.create({
    data: { userId: user.id, name, type: type as (typeof ACCOUNT_TYPES)[number] },
  });

  revalidatePath("/kakeibo/accounts");
}

export async function deleteAccount(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // 取引が残っている口座を消すとデータの整合性が壊れるため、先に取引を消してもらう
  const usedCount = await prisma.transaction.count({
    where: { accountId: id, userId: user.id },
  });
  if (usedCount > 0) {
    throw new Error("この口座を使った取引が残っているため削除できません");
  }

  await prisma.account.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/kakeibo/accounts");
}

export async function createCategory(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const type = formData.get("type") === "INCOME" ? "INCOME" : "EXPENSE";

  if (!name) {
    throw new Error("カテゴリ名を入力してください");
  }

  await prisma.transactionCategory.create({
    data: { userId: user.id, name, type },
  });

  revalidatePath("/kakeibo/categories");
}

export async function deleteCategory(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // categoryId は Transaction 側で optional なので、削除すると該当取引は「未分類」になる
  await prisma.transactionCategory.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/kakeibo/categories");
}

export async function setBudget(formData: FormData) {
  const user = await requireUser();
  const categoryId = String(formData.get("categoryId") ?? "");
  const amountStr = String(formData.get("monthlyAmount") ?? "");
  const amount = Number(amountStr);

  if (!categoryId || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("予算額は1円以上の数値で入力してください");
  }

  // 自分のカテゴリであることを確認してから作成/更新する
  const category = await prisma.transactionCategory.findFirst({
    where: { id: categoryId, userId: user.id },
  });
  if (!category) {
    throw new Error("対象のカテゴリが見つかりません");
  }

  await prisma.budget.upsert({
    where: { categoryId },
    create: { userId: user.id, categoryId, monthlyAmount: Math.round(amount) },
    update: { monthlyAmount: Math.round(amount) },
  });

  revalidatePath("/kakeibo/categories");
  revalidatePath("/kakeibo");
}

export async function deleteBudget(formData: FormData) {
  const user = await requireUser();
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) return;

  await prisma.budget.deleteMany({
    where: { categoryId, category: { userId: user.id } },
  });

  revalidatePath("/kakeibo/categories");
  revalidatePath("/kakeibo");
}

export async function importTransactionsCsv(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("CSVファイルを選択してください");
  }

  // 自分でエクスポートしたCSVには文字コード対策のBOM(U+FEFF)が先頭に付いており、
  // 除去しないとヘッダー1列目("日付")が正しく認識されず全行スキップされてしまう
  const text = (await file.text()).replace(/^\uFEFF/, "");
  const { data, errors } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    throw new Error(`CSVの解析に失敗しました: ${errors[0].message}`);
  }

  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({ where: { userId: user.id } }),
    prisma.transactionCategory.findMany({ where: { userId: user.id } }),
  ]);
  const accountByName = new Map(accounts.map((a) => [a.name, a.id]));
  const categoryByName = new Map(categories.map((c) => [c.name, c.id]));

  interface Row {
    userId: string;
    type: "INCOME" | "EXPENSE";
    amount: number;
    date: Date;
    accountId: string;
    categoryId: string | null;
    memo: string | null;
  }

  const toCreate: Row[] = [];
  const skipReasons: string[] = [];

  data.forEach((row, index) => {
    const rowNumber = index + 2; // 1行目はヘッダーなので+2
    const dateStr = row["日付"]?.trim();
    const typeStr = row["種別"]?.trim();
    const amountStr = row["金額"]?.trim();
    const accountName = row["口座"]?.trim();
    const categoryName = row["カテゴリ"]?.trim();
    const memo = row["メモ"]?.trim() || null;

    const type: "INCOME" | "EXPENSE" | null =
      typeStr === "収入" ? "INCOME" : typeStr === "支出" ? "EXPENSE" : null;
    const amount = Number(amountStr);
    const date = dateStr ? new Date(dateStr) : null;
    const accountId = accountName ? accountByName.get(accountName) : undefined;

    if (!dateStr || !date || Number.isNaN(date.getTime())) {
      skipReasons.push(`${rowNumber}行目: 日付「${dateStr || "(空欄)"}」を解釈できません`);
      return;
    }
    if (!type) {
      skipReasons.push(`${rowNumber}行目: 種別は「収入」か「支出」で入力してください`);
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      skipReasons.push(`${rowNumber}行目: 金額「${amountStr}」が不正です`);
      return;
    }
    if (!accountName || !accountId) {
      skipReasons.push(`${rowNumber}行目: 口座「${accountName || "(空欄)"}」が見つかりません`);
      return;
    }

    toCreate.push({
      userId: user.id,
      type,
      amount: Math.round(amount),
      date,
      accountId,
      categoryId: categoryName ? (categoryByName.get(categoryName) ?? null) : null,
      memo,
    });
  });

  if (toCreate.length > 0) {
    await prisma.transaction.createMany({ data: toCreate });
  }

  revalidatePath("/kakeibo");

  const params = new URLSearchParams({
    imported: String(toCreate.length),
    skipped: String(skipReasons.length),
  });
  if (skipReasons.length > 0) {
    params.set("reasons", skipReasons.join("|"));
  }
  redirect(`/kakeibo/import?${params.toString()}`);
}
