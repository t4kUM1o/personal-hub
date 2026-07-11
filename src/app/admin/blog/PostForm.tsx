import type { Category, Tag, Post, PostTag } from "@prisma/client";
import { MarkdownBodyField } from "./MarkdownBodyField";

interface PostFormProps {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  tags: Tag[];
  submitLabel: string;
  post?: Post & { tags: (PostTag & { tag: Tag })[] };
}

export function PostForm({ action, categories, tags, submitLabel, post }: PostFormProps) {
  const selectedTagIds = new Set(post?.tags.map((t) => t.tagId) ?? []);
  const inputClass =
    "mt-1 w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900";

  return (
    <form action={action} className="mt-6 max-w-2xl space-y-5">
      {post && <input type="hidden" name="id" value={post.id} />}

      <label className="block text-sm text-gray-600 dark:text-gray-400">
        タイトル
        <input type="text" name="title" required defaultValue={post?.title} className={inputClass} />
      </label>

      <label className="block text-sm text-gray-600 dark:text-gray-400">
        概要（一覧・OGPで使用、省略可）
        <input type="text" name="excerpt" defaultValue={post?.excerpt ?? ""} className={inputClass} />
      </label>

      <label className="block text-sm text-gray-600 dark:text-gray-400">
        カテゴリ
        <select name="categoryId" defaultValue={post?.categoryId ?? ""} className={inputClass}>
          <option value="">未分類</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="block text-sm text-gray-600 dark:text-gray-400">
        <legend className="mb-1">タグ</legend>
        <div className="flex flex-wrap gap-3">
          {tags.length === 0 && (
            <p className="text-gray-400">
              タグがまだありません（先に「タグ管理」から作成してください）
            </p>
          )}
          {tags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="tagIds"
                value={tag.id}
                defaultChecked={selectedTagIds.has(tag.id)}
              />
              {tag.name}
            </label>
          ))}
        </div>
      </fieldset>

      <MarkdownBodyField defaultValue={post?.body} />

      <fieldset className="block text-sm text-gray-600 dark:text-gray-400">
        <legend className="mb-1">公開状態</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="status"
              value="DRAFT"
              defaultChecked={!post || post.status === "DRAFT"}
            />
            下書き
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="status" value="PUBLISHED" defaultChecked={post?.status === "PUBLISHED"} />
            公開
          </label>
        </div>
      </fieldset>

      <button
        type="submit"
        className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        {submitLabel}
      </button>
    </form>
  );
}
