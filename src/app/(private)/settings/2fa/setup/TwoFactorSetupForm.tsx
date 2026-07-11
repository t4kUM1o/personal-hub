"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmTwoFactorSetup } from "../../actions";

export function TwoFactorSetupForm({ secret, qrDataUrl }: { secret: string; qrDataUrl: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("secret", secret);
    formData.append("code", code);

    try {
      const result = await confirmTwoFactorSetup(formData);
      setBackupCodes(result.backupCodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "設定に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (backupCodes) {
    return (
      <div className="mt-6 max-w-md">
        <p className="rounded-card bg-accent/10 px-3 py-2 text-sm text-accent">
          2段階認証を有効にしました。
        </p>
        <div className="mt-4 rounded-card border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            バックアップコード（今だけ表示されます。必ずどこかに保存してください）
          </p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            認証アプリを紛失した場合、このコードでログインできます（1つにつき1回だけ使用可）。
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-1.5 font-mono text-sm text-red-700 dark:text-red-400">
            {backupCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => router.push("/settings")}
          className="mt-4 rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          設定画面に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt="認証アプリで読み取るQRコード"
        className="rounded-card border border-gray-200 dark:border-gray-800"
      />
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        QRコードを読み取れない場合は、次のキーを認証アプリに手動で入力してください:
      </p>
      <p className="mt-1 break-all rounded-card bg-gray-100 px-3 py-2 font-mono text-xs dark:bg-gray-800">
        {secret}
      </p>

      <form onSubmit={handleSubmit} className="mt-6">
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-card bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400"
          >
            {error}
          </p>
        )}
        <label className="block text-sm text-gray-600 dark:text-gray-400">
          認証アプリに表示された6桁のコード
          <input
            type="text"
            inputMode="numeric"
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-gray-700 dark:bg-gray-900"
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {isSubmitting ? "確認中..." : "有効にする"}
        </button>
      </form>
    </div>
  );
}
