import { prisma } from "@/lib/prisma";
import { createPost } from "../actions";
import { PostForm } from "../PostForm";

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">新規記事作成</h1>
      <PostForm action={createPost} categories={categories} tags={tags} submitLabel="作成する" />
    </main>
  );
}
