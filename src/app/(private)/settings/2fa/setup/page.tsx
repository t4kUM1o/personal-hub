import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { generateTotpSecret, generateQrCodeDataUrl } from "@/lib/totp";
import { TwoFactorSetupForm } from "./TwoFactorSetupForm";

export default async function TwoFactorSetupPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (user.totpEnabled) {
    redirect("/settings");
  }

  const { secret, otpauthUri } = generateTotpSecret();
  const qrDataUrl = await generateQrCodeDataUrl(otpauthUri(user.email));

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">2段階認証を設定</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
        Google Authenticator や Microsoft Authenticator などの認証アプリでQRコードを読み取り、
        表示された6桁のコードを入力して有効化してください。
      </p>
      <TwoFactorSetupForm secret={secret} qrDataUrl={qrDataUrl} />
    </main>
  );
}
