import chalk from "chalk";

import { ILogger } from "./ILogger";

export default class ConsoleLogger implements ILogger {
  error(message: string) {
    this.output("error", message);
  }
  warn(message: string) {
    this.output("warn", message);
  }

  info(message: string) {
    this.output("info", message);
  }

  http(message: string) {
    this.output("http", message);
  }

  verbose(message: string) {
    this.output("verbose", message);
  }

  debug(message: string) {
    this.output("debug", message);
  }

  silly(message: string) {
    this.output("silly", message);
  }

  private output(severity: keyof ILogger, message: string) {
    let log = console.log;
    chalk.hex("#FFA500").bold();
    let chalkInstance: chalk.Chalk = chalk;
    if (severity === "error") {
      log = console.error;
      chalkInstance = chalkInstance.red;
    }
    if (severity === "warn") {
      log = console.warn;
      chalkInstance = chalkInstance.hex("#FFA500");
    }
    if (severity === "info") {
      log = console.info;
    }

    log(chalkInstance(`${severity.toUpperCase().padEnd(10)} ${message}`)); // ${Date.now()}
  }
}
