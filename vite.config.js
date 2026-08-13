import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/aevinedesign/" : "/",
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  assetsInclude: ["**/*.png", "**/*.jpg", "**/*.webp"],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        project: resolve(import.meta.dirname, "project.html"),
      },
    },
  },
});
