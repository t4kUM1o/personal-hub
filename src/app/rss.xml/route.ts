import { prisma } from "@/lib/prisma";

// DBを見に行くので、ビルド時の静的生成ではなく常にリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  const items = posts
    .map((post) => {
      const link = `${baseUrl}/blog/${post.slug}`;
      const pubDate = (post.publishedAt ?? post.createdAt).toUTCString();
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>${
        post.excerpt ? `\n      <description>${escapeXml(post.excerpt)}</description>` : ""
      }
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Personal Hub Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Personal Hubのブログ更新情報</description>
    <language>ja</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
