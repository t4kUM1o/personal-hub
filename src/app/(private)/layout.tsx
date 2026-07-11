import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { LogoutButton } from "@/components/ui/LogoutButton";

const NAV_ITEMS = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/kakeibo", label: "家計簿" },
  { href: "/settings", label: "設定" },
];

// Private層: ログイン必須。未ログインなら /login へリダイレクトする
export default async function PrivateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-3 px-8 py-4">
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 transition-colors hover:text-accent dark:text-gray-300"
              >
                {item.label}
              </Link>
            ))}
            {user.role === "ADMIN" && (
              <Link
                href="/admin/blog"
                className="text-gray-600 transition-colors hover:text-accent dark:text-gray-300"
              >
                管理画面
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
