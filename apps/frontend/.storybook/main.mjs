import path from "node:path";
import { fileURLToPath } from "node:url";
import { stylexVitePlugin } from "../vite.stylex.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @type {import('@storybook/react-vite').StorybookConfig} */
const config = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  async viteFinal(viteConfig) {
    viteConfig.plugins = [stylexVitePlugin(), ...(viteConfig.plugins || [])];
    viteConfig.resolve = viteConfig.resolve || {};
    viteConfig.resolve.alias = {
      ...(viteConfig.resolve.alias || {}),
      "@": path.join(rootDir, "src"),
    };
    return viteConfig;
  },
};

export default config;
