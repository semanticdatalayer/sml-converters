import chalk from "chalk";
import { Logger } from "./logger";

export default class ConsoleLogger implements Logger {
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

  private output(severity: keyof Logger, message: string) {
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

    log(chalkInstance(`${Date.now()} ${severity.toUpperCase().padEnd(10)} ${message}`));
  }
}
