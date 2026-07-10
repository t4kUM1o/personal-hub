import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePost } from "../../actions";
import { PostForm } from "../../PostForm";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [post, categories, tags] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">記事を編集</h1>
      <PostForm
        action={updatePost}
        categories={categories}
        tags={tags}
        submitLabel="更新する"
        post={post}
      />
    </main>
  );
}
