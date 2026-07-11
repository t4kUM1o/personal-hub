import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { LogoutButton } from "@/components/ui/LogoutButton";

const ADMIN_NAV_ITEMS = [
  { href: "/admin/blog", label: "ブログ管理" },
  { href: "/admin/users", label: "ユーザー管理" },
  { href: "/admin/analytics", label: "アクセス解析" },
  { href: "/admin/logs", label: "ログ管理" },
  { href: "/admin/media", label: "メディア管理" },
  { href: "/admin/system", label: "システム設定" },
];

// Admin層: ログイン必須 + role が ADMIN のユーザーのみ許可
// 未ログイン -> /login へ、ログイン済みだが権限不足 -> /dashboard へ逃がす
// (「このURLの先に管理画面がある」ことを未認可ユーザーに教えないよう、
//  404ではなくリダイレクトで自然に本来の場所へ戻す)
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3 px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 transition-colors hover:text-accent dark:text-gray-400"
            >
              ← ダッシュボード
            </Link>
            <nav className="flex flex-wrap items-center gap-4 text-sm">
              {ADMIN_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 transition-colors hover:text-accent dark:text-gray-300"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
