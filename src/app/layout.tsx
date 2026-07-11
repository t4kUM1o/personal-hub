import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";
import "highlight.js/styles/github-dark.css";

const displayFont = M_PLUS_Rounded_1c({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
  display: "swap",
});

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
      <body
        className={`${displayFont.variable} bg-white text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100`}
      >
        {children}
      </body>
    </html>
  );
}
