import path from "node:path";
import { fileURLToPath } from "node:url";
import { transformAsync } from "@babel/core";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export function stylexVitePlugin() {
  return {
    name: "nicelist-stylex-babel",
    enforce: "pre",
    async transform(code, id) {
      const cleanId = id.split("?")[0];
      if (cleanId.includes("node_modules")) return null;
      if (!/\.[jt]sx?$/.test(cleanId)) return null;
      if (!code.includes("@stylexjs/stylex")) return null;
      const result = await transformAsync(code, {
        filename: cleanId,
        babelrc: false,
        configFile: false,
        parserOpts: {
          plugins: ["typescript", "jsx"],
        },
        plugins: [
          [
            "@stylexjs/babel-plugin",
            {
              dev: true,
              test: true,
              runtimeInjection: true,
              enableInlinedConditionalMerge: true,
              treeshakeCompensation: true,
              aliases: {
                "@/*": [path.join(rootDir, "src", "*")],
              },
              unstable_moduleResolution: {
                type: "commonJS",
                rootDir,
              },
            },
          ],
        ],
        sourceMaps: true,
      });
      if (!result?.code) return null;
      return { code: result.code, map: result.map };
    },
  };
}
