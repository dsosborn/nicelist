import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import react from "@vitejs/plugin-react";
import { stylexVitePlugin } from "../vite.stylex.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "dist");

await build({
  root,
  base: "./",
  plugins: [stylexVitePlugin(), react()],
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: path.join(root, "popup.html"),
      },
    },
  },
});

fs.copyFileSync(path.join(root, "manifest.json"), path.join(outDir, "manifest.json"));
console.log("built extension into", outDir);
