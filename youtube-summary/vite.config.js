import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist", // 빌드 출력 디렉토리
    emptyOutDir: true, // 빌드 전 디렉토리 정리
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content.jsx"),
      },
      output: {
        entryFileNames: "assets/[name].js", // assets 폴더에 생성됨
        format: "iife",
        dir: "dist",
      },
    },
  },
});
