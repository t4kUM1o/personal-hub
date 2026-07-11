import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rateLimit";

const GENERIC_MESSAGE =
  "対象のメールアドレスが登録されている場合、パスワード再設定メールを送信しました";

const FORGOT_PASSWORD_RATE_LIMIT = { maxAttempts: 3, windowMs: 60 * 60 * 1000 }; // 1時間に3回まで

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

  if (!email) {
    return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
  }

  // 実在有無に関わらず同じキーで判定するので、429の有無からアカウントの存在は推測できない
  const rateLimitKey = `forgot-password:${email}`;
  const { allowed, retryAfterSeconds } = checkRateLimit(rateLimitKey, FORGOT_PASSWORD_RATE_LIMIT);
  if (!allowed) {
    const minutes = Math.ceil((retryAfterSeconds ?? 0) / 60);
    return NextResponse.json(
      { error: `リクエストが多すぎます。約${minutes}分後に再度お試しください` },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // ユーザーが存在する場合のみ実際にメール送信するが、
  // レスポンス内容は存在有無にかかわらず常に同じにする
  if (user) {
    const token = await createPasswordResetToken(user.id);
    const baseUrl = process.env.APP_BASE_URL ?? request.nextUrl.origin;
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (error) {
      // メール送信の失敗はサーバーログにのみ残し、レスポンスは変えない
      console.error("[forgot-password] メール送信に失敗しました:", error);
    }
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
