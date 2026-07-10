import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, revokeSessionById } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : null;
  if (!sessionId) {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  // 自分自身のセッションだけを対象にする(他人のセッションIDを渡されても失効できない)
  const revoked = await revokeSessionById(user.id, sessionId);
  if (!revoked) {
    return NextResponse.json({ error: "対象のセッションが見つかりません" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
