type LogFunc = (message: string) => void;

export interface ILogger {
  error: LogFunc;
  warn: LogFunc;
  info: LogFunc;
  http: LogFunc;
  verbose: LogFunc;
  debug: LogFunc;
  silly: LogFunc;
}
