"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import path from "path";
import { getSessionUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }
}

export async function deleteMediaFile(formData: FormData) {
  await requireAdmin();
  const filename = String(formData.get("filename") ?? "");

  // パストラバーサル対策: アップロード時に生成される形式のファイル名だけ許可する
  if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/.test(filename)) {
    return;
  }

  const filePath = path.join(process.cwd(), "uploads", filename);
  await unlink(filePath).catch(() => {
    // 既に無い場合などは無視する
  });

  revalidatePath("/admin/media");
}
