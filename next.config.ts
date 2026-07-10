import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker本番イメージを軽量化するため standalone 出力を使用
  output: "standalone",
};

export default nextConfig;
