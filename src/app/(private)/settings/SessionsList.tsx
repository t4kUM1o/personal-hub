"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface SessionItem {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

function getStatus(session: SessionItem): { label: string; className: string } {
  if (session.revokedAt) {
    return { label: "ログアウト済み", className: "text-gray-400 dark:text-gray-500" };
  }
  if (new Date(session.expiresAt) < new Date()) {
    return { label: "期限切れ", className: "text-gray-400 dark:text-gray-500" };
  }
  return { label: "有効", className: "text-accent" };
}

export function SessionsList({
  sessions,
  currentSessionId,
}: {
  sessions: SessionItem[];
  currentSessionId: string;
}) {
  const router = useRouter();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function handleRevoke(sessionId: string) {
    setRevokingId(sessionId);
    await fetch("/api/auth/sessions/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    setRevokingId(null);
    router.refresh();
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-card border border-gray-200 dark:border-gray-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
          <tr>
            <th className="px-4 py-2 font-medium">状態</th>
            <th className="px-4 py-2 font-medium">IPアドレス</th>
            <th className="px-4 py-2 font-medium">デバイス / ブラウザ</th>
            <th className="px-4 py-2 font-medium">ログイン日時</th>
            <th className="px-4 py-2 font-medium">有効期限</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => {
            const status = getStatus(session);
            const isCurrent = session.id === currentSessionId;
            const isActive = status.label === "有効";

            return (
              <tr key={session.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className={`px-4 py-2 ${status.className}`}>
                  {status.label}
                  {isCurrent && (
                    <span className="ml-2 rounded-card bg-accent/10 px-2 py-0.5 text-xs text-accent">
                      このデバイス
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                  {session.ipAddress ?? "-"}
                </td>
                <td
                  className="max-w-xs truncate px-4 py-2 text-gray-600 dark:text-gray-300"
                  title={session.userAgent ?? undefined}
                >
                  {session.userAgent ?? "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-300">
                  {new Date(session.createdAt).toLocaleString("ja-JP")}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-300">
                  {new Date(session.expiresAt).toLocaleString("ja-JP")}
                </td>
                <td className="px-4 py-2">
                  {isActive && !isCurrent && (
                    <button
                      onClick={() => handleRevoke(session.id)}
                      disabled={revokingId === session.id}
                      className="rounded-card px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      {revokingId === session.id ? "処理中..." : "ログアウトさせる"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
