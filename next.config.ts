import type { NextConfig } from "next";

// Next.jsのハイドレーション処理が<script>にインラインでデータを埋め込むため、
// script-src/style-srcに'unsafe-inline'を含めている(nonceを使ったより厳密な構成は
// ミドルウェアでの動的付与が必要になり複雑化するため、まずはここまでとした)。
// Strict-Transport-Securityは意図的に入れていない: まだHTTPS化していない状態で設定すると、
// ブラウザが以後HTTP接続を拒否するようになり、アクセスできなくなる恐れがあるため。
// HTTPS化した後に追加すること。
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // Docker本番イメージを軽量化するため standalone 出力を使用
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
