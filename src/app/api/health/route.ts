import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/health
// Docker Compose起動後、DBに実際に接続できているかを確認するためのエンドポイント。
// 例: curl http://localhost:3000/api/health
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // 詳細なエラー内容はサーバーログにのみ出力し、レスポンスには漏らさない
    console.error("[health] DB接続に失敗しました:", error);
    return NextResponse.json({ status: "error", db: "disconnected" }, { status: 503 });
  }
}
