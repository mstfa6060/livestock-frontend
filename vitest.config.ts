import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // More specific aliases first (order matters)
      {
        find: /^@\/config\/(.*)/,
        replacement: path.resolve(__dirname, "common/livestock-api/src/config/$1"),
      },
      {
        find: /^@\/services\/(.*)/,
        replacement: path.resolve(
          __dirname,
          "common/livestock-api/src/services/$1"
        ),
      },
      {
        find: /^@\/errors\/(.*)/,
        replacement: path.resolve(
          __dirname,
          "common/livestock-api/src/errors/$1"
        ),
      },
      {
        find: /^@\/api\/(.*)/,
        replacement: path.resolve(
          __dirname,
          "common/livestock-api/src/api/$1"
        ),
      },
      // Legacy aliases (without slash)
      {
        find: /^@config\/(.*)/,
        replacement: path.resolve(__dirname, "common/livestock-api/src/config/$1"),
      },
      {
        find: /^@services\/(.*)/,
        replacement: path.resolve(
          __dirname,
          "common/livestock-api/src/services/$1"
        ),
      },
      {
        find: /^@errors\/(.*)/,
        replacement: path.resolve(
          __dirname,
          "common/livestock-api/src/errors/$1"
        ),
      },
      // General catch-all @/ alias last
      {
        find: /^@\/(.*)/,
        replacement: path.resolve(__dirname, "$1"),
      },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
    css: false,
  },
});
