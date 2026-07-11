import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";
import { createTwoFactorChallenge } from "@/lib/twoFactorChallenge";
import { logAuditEvent } from "@/lib/auditLog";

// bcryptで生成した形式のダミーハッシュ。
// ユーザーが存在しない場合でも必ずbcrypt.compareを実行することで、
// レスポンス内容・時間差から「このメールアドレスは登録されていない」と
// 外部から推測できないようにする。
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8Y0O1Q0Q0Q0Q0Q0Q0Q0Q0Q0Q0Q0Qe";

const LOGIN_RATE_LIMIT = { maxAttempts: 5, windowMs: 15 * 60 * 1000 }; // 15分に5回まで

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
  const password = typeof body?.password === "string" ? body.password : null;

  if (!email || !password) {
    return NextResponse.json(
      { error: "メールアドレスとパスワードを入力してください" },
      { status: 400 }
    );
  }

  const rateLimitKey = `login:${email}`;
  const { allowed, retryAfterSeconds } = checkRateLimit(rateLimitKey, LOGIN_RATE_LIMIT);
  if (!allowed) {
    const minutes = Math.ceil((retryAfterSeconds ?? 0) / 60);
    return NextResponse.json(
      { error: `ログイン試行回数が多すぎます。約${minutes}分後に再度お試しください` },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const isValid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !isValid) {
    return NextResponse.json(
      { error: "メールアドレスまたはパスワードが正しくありません" },
      { status: 401 }
    );
  }

  // ログイン成功したので、このアカウントの失敗カウントはリセットする
  resetRateLimit(rateLimitKey);

  if (user.totpEnabled) {
    const challengeToken = await createTwoFactorChallenge(user.id);
    return NextResponse.json({ twoFactorRequired: true, challengeToken });
  }

  await createSession(user.id, {
    userAgent: request.headers.get("user-agent"),
    ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
  });

  await logAuditEvent({
    userId: user.id,
    action: "login",
    ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
  });

  return NextResponse.json({ id: user.id, email: user.email, role: user.role });
}
