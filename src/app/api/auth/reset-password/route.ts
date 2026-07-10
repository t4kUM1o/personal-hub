import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { consumePasswordResetToken } from "@/lib/passwordReset";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : null;
  const newPassword = typeof body?.password === "string" ? body.password : null;

  if (!token || !newPassword) {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "パスワードは8文字以上にしてください" },
      { status: 400 }
    );
  }

  const userId = await consumePasswordResetToken(token);
  if (!userId) {
    return NextResponse.json(
      { error: "リンクが無効か期限切れです。もう一度パスワードリセットをお試しください" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(newPassword);

  // パスワード変更と同時に、既存の全ログインセッションを無効化する
  // (リセットが必要になった=以前のセッションが乗っ取られている可能性を考慮)
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId } }),
  ]);

  return NextResponse.json({ ok: true });
}
