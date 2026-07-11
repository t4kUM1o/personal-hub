import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY が正しく設定されていません。`openssl rand -hex 32` で生成した64文字の16進数文字列を.envに設定してください"
    );
  }
  return Buffer.from(keyHex, "hex");
}

export function encrypt(plainText: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // iv(12byte) + authTag(16byte) + 暗号文 をまとめてbase64にする
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decrypt(cipherText: string): string {
  const key = getKey();
  const data = Buffer.from(cipherText, "base64");
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const encrypted = data.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
