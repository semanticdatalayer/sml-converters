import { Hook } from "@oclif/core";

// eslint-disable-next-line @typescript-eslint/require-await
const hook: Hook<"init"> = async function (options) {
  if (["-v", "-V", "--version", "version"].includes(process.argv[2])) {
    this.log(`${options.config.version}`);
    return process.exit(0);
  }
};

export default hook;
