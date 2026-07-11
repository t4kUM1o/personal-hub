import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PostList } from "@/components/blog/PostList";

export const dynamic = "force-dynamic";

export default async function CategoryArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) {
    notFound();
  }

  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED", categoryId: category.id },
    orderBy: { publishedAt: "desc" },
    include: { category: true, tags: { include: { tag: true } } },
  });

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/blog" className="text-sm text-accent hover:underline">
        ← ブログ一覧
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        カテゴリ: {category.name}
      </h1>
      <PostList posts={posts} />
    </main>
  );
}
