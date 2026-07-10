// Public層: 認証不要で誰でも閲覧できるページ群 (TOP/ブログ/プロフィール/制作物/お問い合わせ)
export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen">{children}</div>;
}
