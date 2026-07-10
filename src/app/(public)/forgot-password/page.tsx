"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));
    setIsSubmitting(false);
    // サーバー側は常に同じメッセージを返す(存在有無を漏らさないため)ので、そのまま表示する
    setMessage(data.message ?? "処理が完了しました");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-card border border-gray-200 p-8 shadow-sm dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          パスワードをお忘れですか？
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          登録済みのメールアドレスに再設定用のリンクを送ります。
        </p>

        {message ? (
          <p className="mt-6 rounded-card bg-accent/10 px-3 py-2 text-sm text-accent">
            {message}
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="mt-6 block text-sm text-gray-600 dark:text-gray-400">
              メールアドレス
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {isSubmitting ? "送信中..." : "リセットメールを送る"}
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-6 block text-center text-sm text-gray-500 hover:underline dark:text-gray-400"
        >
          ログイン画面に戻る
        </Link>
      </div>
    </main>
  );
}
