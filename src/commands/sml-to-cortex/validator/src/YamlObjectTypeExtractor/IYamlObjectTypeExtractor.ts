import { IParsedFile } from "models/src/IParsedFile";
import { ObjectType } from "models/src/ObjectType";

import ValidatorOutput from "../ValidatorOutput/ValidatorOutput";

export interface IYamlObjectTypeExtractor {
  getType(parsedFile: IParsedFile, validatorOutput: ValidatorOutput): ObjectType | undefined;
}
