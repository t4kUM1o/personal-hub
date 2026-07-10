"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!token) {
    return (
      <div className="w-full max-w-sm rounded-card border border-gray-200 p-8 shadow-sm dark:border-gray-800">
        <p className="text-sm text-red-600 dark:text-red-400">
          リンクが不正です。パスワードリセットをやり直してください。
        </p>
        <Link
          href="/forgot-password"
          className="mt-4 block text-center text-sm text-accent hover:underline"
        >
          パスワードリセットへ
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    setIsSubmitting(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setIsSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "パスワードの再設定に失敗しました");
      return;
    }

    setIsDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (isDone) {
    return (
      <div className="w-full max-w-sm rounded-card border border-gray-200 p-8 shadow-sm dark:border-gray-800">
        <p className="text-sm text-accent">
          パスワードを再設定しました。ログイン画面に移動します...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-card border border-gray-200 p-8 shadow-sm dark:border-gray-800"
    >
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        新しいパスワードを設定
      </h1>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-card bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <label className="mt-6 block text-sm text-gray-600 dark:text-gray-400">
        新しいパスワード
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900"
        />
      </label>

      <label className="mt-4 block text-sm text-gray-600 dark:text-gray-400">
        新しいパスワード（確認）
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {isSubmitting ? "送信中..." : "パスワードを再設定"}
      </button>
    </form>
  );
}
