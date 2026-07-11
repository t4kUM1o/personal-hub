import { readdir, stat } from "fs/promises";
import path from "path";
import { deleteMediaFile } from "./actions";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

interface FileInfo {
  filename: string;
  size: number;
  mtime: Date;
}

async function getUploadedFiles(): Promise<FileInfo[]> {
  const uploadDir = path.join(process.cwd(), "uploads");
  try {
    const filenames = await readdir(uploadDir);
    const files = await Promise.all(
      filenames.map(async (filename) => {
        const stats = await stat(path.join(uploadDir, filename));
        return { filename, size: stats.size, mtime: stats.mtime };
      })
    );
    return files.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  } catch {
    // uploadsディレクトリがまだ無い(一度も画像をアップロードしていない)場合
    return [];
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default async function AdminMediaPage() {
  const files = await getUploadedFiles();
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">メディア管理</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {files.length}件のファイル（合計 {formatSize(totalSize)}）。ブログ記事の画像アップロードで保存されたものです。
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {files.map((file) => (
          <div
            key={file.filename}
            className="rounded-card border border-gray-200 p-2 dark:border-gray-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/uploads/${file.filename}`}
              alt={file.filename}
              className="aspect-square w-full rounded-card object-cover"
            />
            <p
              className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400"
              title={file.filename}
            >
              {file.filename}
            </p>
            <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
            <form action={deleteMediaFile} className="mt-1">
              <input type="hidden" name="filename" value={file.filename} />
              <ConfirmSubmitButton
                confirmMessage="この画像を削除しますか？記事内で使われている場合、表示できなくなります"
                className="text-xs text-red-600 hover:underline dark:text-red-400"
              >
                削除
              </ConfirmSubmitButton>
            </form>
          </div>
        ))}
        {files.length === 0 && (
          <p className="col-span-full text-sm text-gray-400">
            まだアップロードされた画像がありません
          </p>
        )}
      </div>
    </main>
  );
}
