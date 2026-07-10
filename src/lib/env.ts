/**
 * 必須環境変数を取得する。未設定時は起動を継続させず、原因を明示して落とす。
 * ビルド時ではなくリクエスト処理時に評価されるよう、呼び出し側の関数内で使うこと。
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`環境変数 "${key}" が設定されていません。.env を確認してください。`);
  }
  return value;
}
