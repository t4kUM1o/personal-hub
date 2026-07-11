import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostList } from "@/components/blog/PostList";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { promoteScheduledPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function CategoryArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await promoteScheduledPosts();

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
      <Breadcrumbs
        items={[
          { label: "TOP", href: "/" },
          { label: "ブログ", href: "/blog" },
          { label: `カテゴリ: ${category.name}` },
        ]}
      />
      <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
        カテゴリ: {category.name}
      </h1>
      <PostList posts={posts} />
    </main>
  );
}
