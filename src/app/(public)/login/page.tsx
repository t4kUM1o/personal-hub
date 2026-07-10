"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setIsSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "ログインに失敗しました");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-card border border-gray-200 p-8 shadow-sm dark:border-gray-800"
      >
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">ログイン</h1>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-card bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400"
          >
            {error}
          </p>
        )}

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

        <label className="mt-4 block text-sm text-gray-600 dark:text-gray-400">
          パスワード
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {isSubmitting ? "ログイン中..." : "ログイン"}
        </button>

        <Link
          href="/forgot-password"
          className="mt-4 block text-center text-sm text-gray-500 hover:underline dark:text-gray-400"
        >
          パスワードをお忘れですか？
        </Link>
      </form>
    </main>
  );
}
