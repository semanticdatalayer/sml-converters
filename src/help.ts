import { Help } from "@oclif/core";

export default class CustomHelp extends Help {
  formatRoot(): string {
    return [
      `${this.config.pjson.description}\n`,
      "VERSION",
      `  ${this.config.version}\n`,
      "USAGE",
      `  $ ${this.config.bin} [COMMAND]`,
    ].join("\n");
  }
}
