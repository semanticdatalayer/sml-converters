import { Command } from "@oclif/core";
import chalk from "chalk";
import { LOG_LEVEL_PRIORITY, Logger, LogLevel } from "./logger";

export class CommandLogger implements Logger {
  static for(command: Command, logLevel: LogLevel = "info") {
    return new CommandLogger(command, logLevel);
  }

  constructor(
    private command: Command,
    private logLevel: LogLevel = "info",
  ) {}

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

  private output(severity: LogLevel, message: string) {
    if (LOG_LEVEL_PRIORITY[severity] > LOG_LEVEL_PRIORITY[this.logLevel]) {
      return;
    }

    let chalkInstance: chalk.Chalk = chalk;
    if (severity === "error") {
      chalkInstance = chalkInstance.red;
    }
    if (severity === "warn") {
      chalkInstance = chalkInstance.yellow;
    }

    this.command.log(chalkInstance(`[${severity.toUpperCase()}] ${message}`));
  }
}
