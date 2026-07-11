import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PostList } from "@/components/blog/PostList";

export const dynamic = "force-dynamic";

export default async function TagArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tag = await prisma.tag.findUnique({ where: { slug } });
  if (!tag) {
    notFound();
  }

  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED", tags: { some: { tagId: tag.id } } },
    orderBy: { publishedAt: "desc" },
    include: { category: true, tags: { include: { tag: true } } },
  });

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/blog" className="text-sm text-accent hover:underline">
        ← ブログ一覧
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        タグ: #{tag.name}
      </h1>
      <PostList posts={posts} />
    </main>
  );
}
