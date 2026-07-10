import "server-only";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";

const RESET_TOKEN_DURATION_MINUTES = 60;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// 発行: 生トークンを返す（メールに載せる用）。DBにはハッシュだけ保存する
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_DURATION_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return token;
}

// 消費: 有効なら使用済みにしてuserIdを返す。無効/期限切れ/使用済みなら null
export async function consumePasswordResetToken(rawToken: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record.userId;
}
