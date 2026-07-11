"use client";

import { useRef, useState } from "react";
import { uploadImage } from "./actions";

export function MarkdownBodyField({ defaultValue }: { defaultValue?: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同じファイルを連続選択できるようにリセットしておく
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const result = await uploadImage(uploadFormData);

      const markdown = `![${file.name}](${result.url})`;
      const textarea = textareaRef.current;

      if (textarea) {
        const start = textarea.selectionStart ?? textarea.value.length;
        const end = textarea.selectionEnd ?? textarea.value.length;
        textarea.value = textarea.value.slice(0, start) + markdown + textarea.value.slice(end);
        textarea.selectionStart = textarea.selectionEnd = start + markdown.length;
        textarea.focus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm text-gray-600 dark:text-gray-400">
        本文（Markdown）
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
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        <textarea
          ref={textareaRef}
          name="body"
          required
          rows={16}
          defaultValue={defaultValue}
          className="mt-2 w-full rounded-card border border-gray-300 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900"
        />
      </label>
    </div>
  );
}
