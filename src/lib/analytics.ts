import "server-only";
import { prisma } from "@/lib/prisma";

export async function recordPageView(pagePath: string): Promise<void> {
  try {
    await prisma.pageView.create({ data: { path: pagePath } });
  } catch (error) {
    // 解析記録の失敗でページ表示自体を止めないようにする
    console.error("[analytics] ページビュー記録に失敗しました:", error);
  }
}
