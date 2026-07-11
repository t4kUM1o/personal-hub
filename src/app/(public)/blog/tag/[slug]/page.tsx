import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostList } from "@/components/blog/PostList";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { promoteScheduledPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function TagArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await promoteScheduledPosts();

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
      <Breadcrumbs
        items={[
          { label: "TOP", href: "/" },
          { label: "ブログ", href: "/blog" },
          { label: `タグ: #${tag.name}` },
        ]}
      />
      <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
        タグ: #{tag.name}
      </h1>
      <PostList posts={posts} />
    </main>
  );
}
