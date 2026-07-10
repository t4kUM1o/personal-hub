import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LogoutButton } from "@/components/ui/LogoutButton";

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
      <header className="flex items-center justify-between border-b border-gray-200 px-8 py-4 dark:border-gray-800">
        <span className="text-sm text-gray-500 dark:text-gray-400">{user.email}</span>
        <LogoutButton />
      </header>
      {children}
    </div>
  );
}
