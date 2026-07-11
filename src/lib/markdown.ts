import "server-only";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import DOMPurify from "isomorphic-dompurify";

marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);

marked.setOptions({
  breaks: true, // 改行をそのまま<br>に変換する(いわゆるQiita/Zenn的な挙動)
  gfm: true,
});

export function renderMarkdown(source: string): string {
  const rawHtml = marked.parse(source, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml);
}
