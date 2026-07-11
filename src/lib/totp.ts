import "server-only";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { encrypt, decrypt } from "./encryption";

const ISSUER = "Personal Hub";

export function generateTotpSecret(): {
  secret: string;
  otpauthUri: (email: string) => string;
} {
  const secret = new OTPAuth.Secret({ size: 20 }).base32;

  return {
    secret,
    otpauthUri: (email: string) => {
      const totp = new OTPAuth.TOTP({
        issuer: ISSUER,
        label: email,
        secret: OTPAuth.Secret.fromBase32(secret),
      });
      return totp.toString();
    },
  };
}

export async function generateQrCodeDataUrl(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri);
}

// ±1ステップ(前後30秒)までの時刻ズレを許容する
export function verifyTotpCode(base32Secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(base32Secret) });
  return totp.validate({ token: code, window: 1 }) !== null;
}

export function encryptSecret(secret: string): string {
  return encrypt(secret);
}

export function decryptSecret(encrypted: string): string {
  return decrypt(encrypted);
}
