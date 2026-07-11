import type { Metadata } from "next";
import "./globals.css";
import "highlight.js/styles/github-dark.css";

export const metadata: Metadata = {
  title: "Personal Hub",
  description: "個人用統合Webサイト - ブログ / 家計簿 / ダッシュボード",
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: "Personal Hub Blog" }],
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="bg-white text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
