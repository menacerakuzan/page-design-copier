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
    // Allow viewing the dev server through an ngrok tunnel (mobile preview during design work).
    allowedHosts: [".ngrok-free.dev", ".ngrok-free.app", ".ngrok.io"],
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
      // Media + on-the-fly resize are served by the local storage-server (:5100),
      // which serves the FULL /storage/v1/... path — no prefix stripping here.
      "/storage/v1": {
        target: "http://127.0.0.1:5100",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  build: {
    // Don't modulepreload the heavy on-demand chunks (maplibre, admin/editor) on
    // the landing page — they should load only when their route/overlay is used.
    modulePreload: {
      resolveDependencies: (_file, deps) =>
        deps.filter((d) => !/maplibre|Admin|editor/i.test(d)),
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep font filenames stable (unhashed) so the <link rel=preload> in
          // index.html resolves in the production build.
          if (/\.(otf|woff2?|ttf)$/i.test(assetInfo.name ?? "")) return "assets/fonts/[name][extname]";
          return "assets/[name]-[hash][extname]";
        },
        // Split heavy vendors into their own chunks. The big win is maplibre:
        // it's only used by the map routes (Nearby / RouteMap), so isolating it
        // keeps it out of the main bundle and loads it on demand.
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return;
          // maplibre: force into its own chunk so it isn't hoisted into the entry
          // (it's shared by two lazy routes — Nearby and the routes overlay).
          if (id.includes("maplibre")) return "maplibre";
          if (id.includes("framer-motion")) return "framer";
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return "react";
          if (id.includes("@tanstack")) return "react-query";
          // NOTE: tiptap/prosemirror (editor) and recharts are intentionally NOT
          // split out — they're admin-only and belong in the lazy Admin chunk, so
          // they don't get modulepreloaded on the public landing page.
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
