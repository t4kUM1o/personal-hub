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

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

function slugifyHeading(text: string): string {
  return (
    text
      .trim()
      .replace(/[<>"'&]/g, "")
      .replace(/\s+/g, "-") || "section"
  );
}

// Markdownをレンダリングしつつ、h2/h3にidを振って目次データも一緒に作る。
// marked v5+はheaderIdsオプションが廃止されたため、サニタイズ後のHTMLに正規表現で後付けしている。
export function renderMarkdownWithToc(source: string): { html: string; toc: TocItem[] } {
  const rawHtml = marked.parse(source, { async: false }) as string;
  const sanitized = DOMPurify.sanitize(rawHtml);

  const toc: TocItem[] = [];
  const usedIds = new Set<string>();

  const html = sanitized.replace(/<h([23])>(.*?)<\/h\1>/g, (_match, level: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "");
    const baseId = slugifyHeading(text);
    let id = baseId;
    let n = 2;
    while (usedIds.has(id)) {
      id = `${baseId}-${n}`;
      n += 1;
    }
    usedIds.add(id);
    toc.push({ id, text, level: Number(level) as 2 | 3 });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });

  return { html, toc };
}
