import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// DBを見に行くので、ビルド時の静的生成ではなく常にリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/blog`, changeFrequency: "daily", priority: 0.8 },
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...postPages];
}
