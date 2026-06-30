import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // Local dev: proxy Supabase-style paths to the local PostgREST (port 3100),
    // stripping the /rest/v1 (and /auth/v1, /storage/v1) prefixes that the
    // production gateway would normally remove. Keeps requests same-origin (no CORS).
    proxy: {
      "/rest/v1": {
        target: "http://127.0.0.1:3100",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/rest\/v1/, ""),
      },
      "/auth/v1": {
        target: "http://127.0.0.1:3100",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/auth\/v1/, ""),
      },
      "/storage/v1": {
        target: "http://127.0.0.1:3100",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/storage\/v1/, ""),
      },
    },
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".otf")) return "assets/fonts/[name][extname]";
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
});
