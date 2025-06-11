import IYamlParsedFile from "models/src/IYamlParsedFile";

import { IYamlObjectSchemaValidator } from "../IYamlObjectSchemaValidator";
import { IYamlObjectSchemaValidatorResponse } from "../IYamlObjectSchemaValidatorResponse";

export default class DummyYamlObjectSchemaValidator implements IYamlObjectSchemaValidator {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateAML(yamlParsedFile: IYamlParsedFile): IYamlObjectSchemaValidatorResponse {
    return { isValid: true, errors: [] };
  }
}
