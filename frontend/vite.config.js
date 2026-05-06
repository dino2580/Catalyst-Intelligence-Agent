import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const proxyTarget = process.env.VITE_PROXY_TARGET || "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/upload": proxyTarget,
      "/summary": proxyTarget,
      "/datasets": proxyTarget,
      "/rank": proxyTarget,
      "/processed-data": proxyTarget,
      "/download": proxyTarget,
      "/api": proxyTarget,
    },
  },
});
