import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Stable env for the data layer regardless of the developer's .env.local.
    env: {
      VITE_API_URL: "http://localhost:8080",
      VITE_API_ANON_KEY: "test-anon-key",
      VITE_OPENWEATHER_KEY: "test-weather-key",
      VITE_ADMIN_EMAIL: "admin@test.local",
      VITE_ADMIN_PASSWORD: "test-pass",
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
