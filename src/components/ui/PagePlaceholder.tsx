interface PagePlaceholderProps {
  title: string;
  description?: string;
}

// Step 1時点では各ページの中身は未実装。
// ディレクトリ構成とルーティングの疎通確認だけを目的とした共通コンポーネント。
// 実際のUIは各機能を実装するステップで frontend-design の指針に沿って作り直す。
export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
      {description && (
        <p className="mt-2 text-gray-500 dark:text-gray-400">{description}</p>
      )}
      <p className="mt-6 inline-block rounded-card bg-accent/10 px-3 py-1 text-sm text-accent">
        Step 1: ルーティング雛形のみ実装済み
      </p>
    </main>
  );
}
