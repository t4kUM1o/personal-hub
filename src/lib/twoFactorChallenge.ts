import "server-only";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";

const CHALLENGE_DURATION_MINUTES = 5;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createTwoFactorChallenge(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + CHALLENGE_DURATION_MINUTES * 60 * 1000);

  await prisma.twoFactorChallenge.create({ data: { userId, tokenHash, expiresAt } });
  return token;
}

// 読み取りのみ(削除しない)。コード入力を何度か間違えても、有効期限内なら再挑戦できるようにするため
export async function getTwoFactorChallengeUserId(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);
  const challenge = await prisma.twoFactorChallenge.findUnique({ where: { tokenHash } });

  if (!challenge || challenge.expiresAt < new Date()) {
    return null;
  }
  return challenge.userId;
}

// コード検証に成功した時だけ呼ぶ
export async function deleteTwoFactorChallenge(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await prisma.twoFactorChallenge.deleteMany({ where: { tokenHash } });
}
