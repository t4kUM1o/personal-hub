"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { verifyTotpCode, encryptSecret } from "@/lib/totp";
import { generateBackupCodes } from "@/lib/backupCodes";

async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function confirmTwoFactorSetup(
  formData: FormData
): Promise<{ backupCodes: string[] }> {
  const user = await requireUser();

  const secret = String(formData.get("secret") ?? "");
  const code = String(formData.get("code") ?? "").trim();

  if (!secret || !code) {
    throw new Error("不正なリクエストです");
  }
  if (!verifyTotpCode(secret, code)) {
    throw new Error("コードが正しくありません。もう一度お試しください");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: encryptSecret(secret), totpEnabled: true },
  });

  return { backupCodes: await generateBackupCodes(user.id) };
}

export async function disableTwoFactor(formData: FormData) {
  const user = await requireUser();
  void formData;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: null, totpEnabled: false },
    }),
    prisma.backupCode.deleteMany({ where: { userId: user.id } }),
  ]);
}

export async function regenerateBackupCodes(): Promise<{ backupCodes: string[] }> {
  const user = await requireUser();
  if (!user.totpEnabled) {
    throw new Error("2段階認証が有効になっていません");
  }
  return { backupCodes: await generateBackupCodes(user.id) };
}
