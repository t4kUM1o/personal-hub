"use client";

import { useState } from "react";
import { submitComment } from "./actions";

export function CommentForm({ postId }: { postId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("postId", postId);

    const result = await submitComment(formData);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    form.reset();
    setMessage("コメントを投稿しました。承認され次第、表示されます。");
  }

  if (message) {
    return (
      <p className="mt-4 rounded-card bg-accent/10 px-3 py-2 text-sm text-accent">{message}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 max-w-lg space-y-3">
      {error && (
        <p
          role="alert"
          className="rounded-card bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400"
        >
          {error}
        </p>
      )}

      {/* ハニーポット: 人間には見えない欄。ボットが埋めがちなので、埋まっていたら弾く */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px]"
        aria-hidden="true"
      />

      <label className="block text-sm text-gray-600 dark:text-gray-400">
        お名前
        <input
          type="text"
          name="authorName"
          required
          maxLength={50}
          className="mt-1 w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900"
        />
      </label>

      <label className="block text-sm text-gray-600 dark:text-gray-400">
        コメント
        <textarea
          name="body"
          required
          maxLength={2000}
          rows={4}
          className="mt-1 w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {isSubmitting ? "送信中..." : "コメントする"}
      </button>
    </form>
  );
}
