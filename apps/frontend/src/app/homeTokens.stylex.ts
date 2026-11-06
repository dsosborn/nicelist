import * as stylex from "@stylexjs/stylex";

const DARK = "@media (prefers-color-scheme: dark)";

export const homeColors = stylex.defineVars({
  background: { default: "#fafafa", [DARK]: "#000" },
  foreground: { default: "#fff", [DARK]: "#000" },
  textPrimary: { default: "#000", [DARK]: "#ededed" },
  textSecondary: { default: "#666", [DARK]: "#999" },
  buttonPrimaryHover: { default: "#383838", [DARK]: "#ccc" },
  buttonSecondaryHover: { default: "#f2f2f2", [DARK]: "#1a1a1a" },
  buttonSecondaryBorder: { default: "#ebebeb", [DARK]: "#1a1a1a" },
});
