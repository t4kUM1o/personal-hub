import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // 仕様書: 白黒ベース + 青系アクセント
        accent: {
          DEFAULT: "#2563eb",
          hover: "#1d4ed8",
        },
      },
      borderRadius: {
        card: "1rem", // 仕様書: 角丸カードUI
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
