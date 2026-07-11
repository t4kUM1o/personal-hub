"use client";

import { useState } from "react";
import { regenerateBackupCodes } from "./actions";

export function RegenerateBackupCodesButton() {
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (!confirm("バックアップコードを再生成しますか？古いコードは使えなくなります。")) {
      return;
    }
    setIsLoading(true);
    setError(null);

    const result = await regenerateBackupCodes();
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.backupCodes) {
      setCodes(result.backupCodes);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="text-sm text-accent hover:underline disabled:opacity-50"
      >
        {isLoading ? "生成中..." : "バックアップコードを再生成"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {codes && (
        <div className="mt-2 rounded-card border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
          <p className="text-xs font-medium text-red-700 dark:text-red-400">
            新しいバックアップコード（今だけ表示。必ず保存してください）
          </p>
          <ul className="mt-1 grid grid-cols-2 gap-1 font-mono text-xs text-red-700 dark:text-red-400">
            {codes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
