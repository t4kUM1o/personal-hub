// タイトル/名前からURL用のslugを作る。
// 日本語タイトルはそのままだと空文字になりがちなので、その場合はランダムな短い文字列にする。
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || `item-${Math.random().toString(36).slice(2, 8)}`;
}
