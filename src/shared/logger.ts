type LogFunc = (message: string) => void;

export interface Logger {
  error: LogFunc;
  warn: LogFunc;
  info: LogFunc;
  http: LogFunc;
  verbose: LogFunc;
  debug: LogFunc;
  silly: LogFunc;
}
