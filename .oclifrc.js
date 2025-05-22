module.exports = {
  bin: "sml-converters",
  dirname: "sml-converters",
  commands: {
    strategy: "explicit",
    target: "./dist/index.js",
    identifier: "COMMANDS",
  },
  plugins: ["@oclif/plugin-help"],
  helpClass: "./dist/help",
  hooks: {
    init: [
      {
        target: "./dist/index.js",
        identifier: "INIT_HOOK",
      },
    ],
  },
};
