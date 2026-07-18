import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

// Task 13.4: a separate Vite-based config from Next.js's own Turbopack
// build -- Vitest needs its own transform pipeline, but the path alias
// below is kept in sync with tsconfig.json's "@/*" mapping so test files
// can import the exact same way application code does.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    testTimeout: 15000,
  },
});
