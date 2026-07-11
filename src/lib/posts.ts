import "server-only";
import { prisma } from "@/lib/prisma";

// 専用のcronジョブを用意する代わりに、公開ページへのアクセスをトリガーにして
// 予約時刻を過ぎた記事を公開済みに昇格させる簡易的な方式。
export async function promoteScheduledPosts(): Promise<void> {
  await prisma.post.updateMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
}
