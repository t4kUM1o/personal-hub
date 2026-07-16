"use client";

import { useState } from "react";
import { uploadImage } from "./actions";

export function CoverImageField({ defaultValue }: { defaultValue?: string | null }) {
  const [imageUrl, setImageUrl] = useState<string | null>(defaultValue ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadImage(formData);
    setIsUploading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.url) {
      setImageUrl(result.url);
    }
  }

  return (
    <div>
      <label className="block text-sm text-gray-600 dark:text-gray-400">
        カバー画像（一覧・記事上部に表示。任意）
        <div className="mt-1 flex items-center gap-3">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={isUploading}
            className="text-xs"
          />
          {isUploading && <span className="text-xs text-gray-400">アップロード中...</span>}
        </div>
      </label>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}

      <input type="hidden" name="coverImage" value={imageUrl ?? ""} />

      {imageUrl && (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="カバー画像プレビュー"
            className="max-h-40 rounded-card border border-gray-200 dark:border-gray-800"
          />
          <button
            type="button"
            onClick={() => setImageUrl(null)}
            className="mt-1 block text-xs text-red-600 hover:underline dark:text-red-400"
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}
