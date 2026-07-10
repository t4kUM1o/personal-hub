import "server-only";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

const SESSION_COOKIE_NAME = "personal_hub_session";
const SESSION_DURATION_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

interface SessionMeta {
  userAgent?: string | null;
  ipAddress?: string | null;
}

// ログイン成功時に呼ぶ。DBにセッションを作成し、Cookieには生トークンのみを渡す
// (DBには生トークンのハッシュだけを保存するので、DBが漏洩してもCookieを偽造できない)
export async function createSession(userId: string, meta: SessionMeta = {}) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: meta.userAgent ?? undefined,
      ipAddress: meta.ipAddress ?? undefined,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    // HTTPS経由でアクセスしている場合のみ true にすること。
    // Secure属性付きCookieはHTTPS以外では保存されないため、
    // リバースプロキシでHTTPS化するまでは COOKIE_SECURE=false のままにする。
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

interface CurrentSession {
  user: User;
  sessionId: string;
}

// Server Component / Route Handler から現在のセッション(ユーザー+セッションID)を取得する
// Cookieが無い・セッションが無効・失効済み・期限切れの場合は null を返す
export async function getCurrentSession(): Promise<CurrentSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }

  return { user: session.user, sessionId: session.id };
}

// ユーザーだけが欲しい場合の簡易版（既存の呼び出し元との互換用）
export async function getSessionUser(): Promise<User | null> {
  const current = await getCurrentSession();
  return current?.user ?? null;
}

// ログアウト: 削除ではなく「無効化フラグを立てる」方式にすることで、
// ログイン履歴画面に「いつ・どこからログインし、いつログアウトしたか」を残せるようにする
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

// ログイン履歴・デバイス管理画面用: 指定ユーザーの全セッション(有効/期限切れ/失効済み含む)を新しい順で返す
export async function listUserSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// デバイス管理画面からの「このデバイスをログアウトさせる」用。
// 呼び出し元で「対象セッションが自分自身のものか」を必ず確認すること。
export async function revokeSessionById(userId: string, sessionId: string): Promise<boolean> {
  const result = await prisma.session.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count > 0;
}
