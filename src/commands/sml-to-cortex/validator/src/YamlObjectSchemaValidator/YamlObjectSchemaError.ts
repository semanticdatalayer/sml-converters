import { ErrorObject } from "ajv";
import Guard from "utils/Guard";

export default class YamlObjectSchemaError extends Error {
  constructor(public readonly errors: Array<string>) {
    const message = errors.join(",");
    super(message);
  }

  static fromAvjError(errors: ErrorObject<string, Record<string, unknown>, unknown>[] | undefined | null) {
    const existingErrors = Guard.ensure(errors, "No errors provided");
    const errMessages = existingErrors.map((e) => {
      return e.message || e.keyword;
    });
    return new YamlObjectSchemaError(errMessages);
  }

  static single(error: string): YamlObjectSchemaError {
    return new YamlObjectSchemaError([error]);
  }
}
