"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
