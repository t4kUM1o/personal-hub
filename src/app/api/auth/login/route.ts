import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";

// bcryptで生成した形式のダミーハッシュ。
// ユーザーが存在しない場合でも必ずbcrypt.compareを実行することで、
// レスポンス内容・時間差から「このメールアドレスは登録されていない」と
// 外部から推測できないようにする。
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8Y0O1Q0Q0Q0Q0Q0Q0Q0Q0Q0Q0Q0Qe";

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

  const user = await prisma.user.findUnique({ where: { email } });
  const isValid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !isValid) {
    return NextResponse.json(
      { error: "メールアドレスまたはパスワードが正しくありません" },
      { status: 401 }
    );
  }

  await createSession(user.id, {
    userAgent: request.headers.get("user-agent"),
    ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
  });

  return NextResponse.json({ id: user.id, email: user.email, role: user.role });
}
