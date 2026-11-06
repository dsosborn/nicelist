import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { stylexVitePlugin } from "./vite.stylex.mjs";

export default defineConfig({
  plugins: [stylexVitePlugin(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
});
