import { ILogger } from "models/src/ILogger";
import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

export default class LoggerServiceBuilder extends AnyObjectBuilder<ILogger> {
  static create() {
    const defaults: ILogger = {
      debug: jest.fn(),
      error: jest.fn(),
      http: jest.fn(),
      info: jest.fn(),
      silly: jest.fn(),
      verbose: jest.fn(),
      warn: jest.fn(),
    };
    return new LoggerServiceBuilder(defaults, { cloneFunctions: true });
  }
}
