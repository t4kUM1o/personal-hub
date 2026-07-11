import "server-only";
import { prisma } from "@/lib/prisma";

export async function logAuditEvent(params: {
  userId?: string | null;
  action: string;
  detail?: string;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        detail: params.detail ?? null,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (error) {
    // ログ記録の失敗で本来の処理(ログイン等)を止めないようにする
    console.error("[auditLog] 記録に失敗しました:", error);
  }
}
