import { IParsedFile } from "models/src/IParsedFile";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import errorUtil from "utils/error.util";

import { IYamlObjectSchemaValidator } from "./IYamlObjectSchemaValidator";
import { IYamlObjectSchemaValidatorResponse } from "./IYamlObjectSchemaValidatorResponse";
import { ISchemaObject, ISchemaValidatorWrapper } from "./SchemaValidatorWrapper/ISchemaValidatorWrapper";
import YamlObjectSchemaError from "./YamlObjectSchemaError";

export default abstract class YamlObjectSchemaValidatorBase implements IYamlObjectSchemaValidator {
  constructor(
    protected readonly schemaValidator: ISchemaValidatorWrapper,
    protected readonly jsonSchema: ISchemaObject
  ) {}

  validateAML(parsedFile: IYamlParsedFile | IParsedFile): IYamlObjectSchemaValidatorResponse {
    try {
      this.schemaValidator.compileSchema(this.jsonSchema).validate(parsedFile);
    } catch (e) {
      if (e instanceof YamlObjectSchemaError) {
        return {
          isValid: false,
          errors: e.errors,
        };
      }

      const err = errorUtil.getErrorMessage(e);

      return {
        isValid: false,
        errors: [err],
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }

  ensureRule(rule: boolean, error: string) {
    if (!rule) {
      throw YamlObjectSchemaError.single(error);
    }
  }
}
