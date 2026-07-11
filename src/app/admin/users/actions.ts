"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/auditLog";

interface ActionState {
  error?: string;
}

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }
  return user;
}

export async function updateUserRole(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const currentUser = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!id || (role !== "USER" && role !== "ADMIN")) {
    return { error: "不正なリクエストです" };
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return { error: "対象のユーザーが見つかりません" };
  }

  if (role === "USER" && target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return { error: "最後の管理者の権限は外せません" };
    }
  }

  await prisma.user.update({ where: { id }, data: { role } });
  await logAuditEvent({
    userId: currentUser.id,
    action: "user_role_changed",
    detail: `${target.email} を ${role} に変更`,
  });

  revalidatePath("/admin/users");
  return {};
}

export async function deleteUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const currentUser = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "不正なリクエストです" };
  }
  if (id === currentUser.id) {
    return { error: "自分自身は削除できません" };
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return { error: "対象のユーザーが見つかりません" };
  }

  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return { error: "最後の管理者は削除できません" };
    }
  }

  await prisma.user.delete({ where: { id } });
  await logAuditEvent({
    userId: currentUser.id,
    action: "user_deleted",
    detail: target.email,
  });

  revalidatePath("/admin/users");
  return {};
}
