"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }
  return user;
}

async function uniquePostSlug(title: string, excludeId?: string): Promise<string> {
  let slug = slugify(title);
  let n = 1;
  while (
    await prisma.post.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    })
  ) {
    n += 1;
    slug = `${slugify(title)}-${n}`;
  }
  return slug;
}

async function uniqueCategorySlug(name: string): Promise<string> {
  let slug = slugify(name);
  let n = 1;
  while (await prisma.category.findFirst({ where: { slug } })) {
    n += 1;
    slug = `${slugify(name)}-${n}`;
  }
  return slug;
}

async function uniqueTagSlug(name: string): Promise<string> {
  let slug = slugify(name);
  let n = 1;
  while (await prisma.tag.findFirst({ where: { slug } })) {
    n += 1;
    slug = `${slugify(name)}-${n}`;
  }
  return slug;
}

export async function createPost(formData: FormData) {
  const user = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const status = formData.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const tagIds = formData.getAll("tagIds").map(String);

  if (!title || !body) {
    throw new Error("タイトルと本文は必須です");
  }

  const slug = await uniquePostSlug(title);

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      body,
      excerpt,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      authorId: user.id,
      categoryId,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect(`/admin/blog/${post.id}/edit`);
}

export async function updatePost(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const status = formData.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const tagIds = formData.getAll("tagIds").map(String);

  if (!id || !title || !body) {
    throw new Error("不正なリクエストです");
  }

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("記事が見つかりません");
  }

  const slug = existing.title === title ? existing.slug : await uniquePostSlug(title, id);

  await prisma.$transaction([
    prisma.postTag.deleteMany({ where: { postId: id } }),
    prisma.post.update({
      where: { id },
      data: {
        title,
        slug,
        body,
        excerpt,
        status,
        publishedAt: status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : null,
        categoryId,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
    }),
  ]);

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  redirect("/admin/blog");
}

export async function deletePost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.post.delete({ where: { id } });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("カテゴリ名を入力してください");
  }

  const slug = await uniqueCategorySlug(name);
  await prisma.category.create({ data: { name, slug } });
  revalidatePath("/admin/blog/categories");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // categoryId は Post 側で optional のため、削除すると該当記事は「未分類」になる (onDelete: SetNull)
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/blog/categories");
  revalidatePath("/admin/blog");
}

export async function createTag(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("タグ名を入力してください");
  }

  const slug = await uniqueTagSlug(name);
  await prisma.tag.create({ data: { name, slug } });
  revalidatePath("/admin/blog/tags");
}

export async function deleteTag(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.tag.delete({ where: { id } });
  revalidatePath("/admin/blog/tags");
  revalidatePath("/admin/blog");
}

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// 記事エディタから画像をアップロードし、公開URLを返す。
// file.type はクライアント側の自己申告なので完全には信頼できないが、
// アップロードできるのは管理者(信頼済みユーザー)のみなので、この程度の検証に留めている。
export async function uploadImage(formData: FormData): Promise<{ url: string }> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("ファイルが選択されていません");
  }

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    throw new Error("対応していない画像形式です（jpg / png / webp / gif のみ）");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("画像サイズは5MB以内にしてください");
  }

  const uploadDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadDir, { recursive: true });

  // 元のファイル名は使わず、ランダムな名前にする(パストラバーサル・上書き事故の防止)
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return { url: `/uploads/${filename}` };
}
