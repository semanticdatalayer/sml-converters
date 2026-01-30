type LogFunc = (message: string) => void;

export type LogLevel = "error" | "warn" | "info" | "http" | "verbose" | "debug" | "silly";

export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

export interface Logger {
  error: LogFunc;
  warn: LogFunc;
  info: LogFunc;
  http: LogFunc;
  verbose: LogFunc;
  debug: LogFunc;
  silly: LogFunc;
}
