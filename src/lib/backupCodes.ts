import "server-only";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function generateCode(): string {
  // 読み間違えにくいよう英数字8桁、ハイフン区切り (例: A1B2-C3D4)
  const raw = randomBytes(4).toString("hex").toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

// 呼び出すたびに既存のコードを全て破棄して作り直す(バックアップコードの再生成)
export async function generateBackupCodes(userId: string, count = 10): Promise<string[]> {
  await prisma.backupCode.deleteMany({ where: { userId } });

  const codes = Array.from({ length: count }, generateCode);
  const rows = await Promise.all(
    codes.map(async (code) => ({
      userId,
      codeHash: await bcrypt.hash(code, 10),
    }))
  );

  await prisma.backupCode.createMany({ data: rows });
  return codes;
}

// 使用済みでないコードの中から一致するものを探し、あれば使用済みにする
export async function consumeBackupCode(userId: string, code: string): Promise<boolean> {
  const candidates = await prisma.backupCode.findMany({
    where: { userId, usedAt: null },
  });

  for (const candidate of candidates) {
    if (await bcrypt.compare(code, candidate.codeHash)) {
      await prisma.backupCode.update({
        where: { id: candidate.id },
        data: { usedAt: new Date() },
      });
      return true;
    }
  }

  return false;
}
