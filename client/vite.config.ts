import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: resolve(__dirname),
  plugins: [react()],
  css: {
    postcss: resolve(__dirname, "postcss.config.js"),
  },
  server: {
    port: 5173,
    // Avoid Windows "localhost refused" when the browser uses IPv6 (::1) but Node only bound IPv4.
    host: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/health": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/ws/markets": {
        target: "http://127.0.0.1:3001",
        ws: true,
        changeOrigin: true,
      },
      "/binance": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: resolve(__dirname, "dist"),
  },
});
