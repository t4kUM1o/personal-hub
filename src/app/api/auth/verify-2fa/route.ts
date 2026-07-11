import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { getTwoFactorChallengeUserId, deleteTwoFactorChallenge } from "@/lib/twoFactorChallenge";
import { verifyTotpCode, decryptSecret } from "@/lib/totp";
import { consumeBackupCode } from "@/lib/backupCodes";

const TWO_FA_RATE_LIMIT = { maxAttempts: 8, windowMs: 15 * 60 * 1000 };

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const challengeToken = typeof body?.challengeToken === "string" ? body.challengeToken : null;
  const code = typeof body?.code === "string" ? body.code.trim() : null;

  if (!challengeToken || !code) {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const rateLimitKey = `2fa:${challengeToken}`;
  const { allowed, retryAfterSeconds } = checkRateLimit(rateLimitKey, TWO_FA_RATE_LIMIT);
  if (!allowed) {
    const minutes = Math.ceil((retryAfterSeconds ?? 0) / 60);
    return NextResponse.json(
      { error: `試行回数が多すぎます。約${minutes}分後にもう一度ログインからやり直してください` },
      { status: 429 }
    );
  }

  const userId = await getTwoFactorChallengeUserId(challengeToken);
  if (!userId) {
    return NextResponse.json(
      { error: "セッションの有効期限が切れました。もう一度ログインしてください" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  let isValid = false;
  if (/^\d{6}$/.test(code)) {
    isValid = verifyTotpCode(decryptSecret(user.totpSecret), code);
  }
  if (!isValid) {
    isValid = await consumeBackupCode(user.id, code);
  }

  if (!isValid) {
    return NextResponse.json({ error: "認証コードが正しくありません" }, { status: 401 });
  }

  await deleteTwoFactorChallenge(challengeToken);

  await createSession(user.id, {
    userAgent: request.headers.get("user-agent"),
    ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
  });

  return NextResponse.json({ id: user.id, email: user.email, role: user.role });
}
