import IYamlParsedFile from "models/src/IYamlParsedFile";

import { IYamlObjectSchemaValidatorResponse } from "./IYamlObjectSchemaValidatorResponse";

export interface IYamlObjectSchemaValidator {
  validateAML(yamlParsedFile: IYamlParsedFile): IYamlObjectSchemaValidatorResponse;
}
