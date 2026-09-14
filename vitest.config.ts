import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    pool: "forks",
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {},
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});