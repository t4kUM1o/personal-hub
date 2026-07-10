import "server-only";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

marked.setOptions({
  breaks: true, // 改行をそのまま<br>に変換する(いわゆるQiita/Zenn的な挙動)
  gfm: true,
});

export function renderMarkdown(source: string): string {
  const rawHtml = marked.parse(source, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml);
}
