const babelConfig = require("./babel.config");

const stylexPlugin = babelConfig.plugins.find(
  (plugin) => Array.isArray(plugin) && plugin[0] === "@stylexjs/babel-plugin",
);

module.exports = {
  plugins: {
    "@stylexjs/postcss-plugin": {
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      babelConfig: {
        babelrc: false,
        parserOpts: { plugins: ["typescript", "jsx"] },
        plugins: [stylexPlugin],
      },
      useCSSLayers: true,
    },
    autoprefixer: {},
  },
};
