"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

const COMMENT_RATE_LIMIT = { maxAttempts: 5, windowMs: 10 * 60 * 1000 };

export async function submitComment(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const postId = String(formData.get("postId") ?? "");
  const authorName = String(formData.get("authorName") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  // ハニーポット: 人間には見えない欄。ボットは埋めがちなので、埋まっていたら黙って弾く
  const honeypot = String(formData.get("website") ?? "");

  if (honeypot) {
    return { ok: true };
  }

  if (!postId || !authorName || !body) {
    return { error: "お名前とコメントを入力してください" };
  }
  if (authorName.length > 50 || body.length > 2000) {
    return { error: "文字数が長すぎます" };
  }

  const { allowed } = checkRateLimit(`comment:${postId}`, COMMENT_RATE_LIMIT);
  if (!allowed) {
    return { error: "コメントの投稿が多すぎます。しばらくしてからお試しください" };
  }

  const post = await prisma.post.findFirst({ where: { id: postId, status: "PUBLISHED" } });
  if (!post) {
    return { error: "対象の記事が見つかりません" };
  }

  await prisma.comment.create({
    data: { postId, authorName, body, approved: false },
  });

  revalidatePath(`/blog/${post.slug}`);
  return { ok: true };
}
