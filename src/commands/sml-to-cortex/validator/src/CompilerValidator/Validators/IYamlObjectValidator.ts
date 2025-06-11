import IYamlParsedFile from "models/src/IYamlParsedFile";

import ValidatorOutput from "../../ValidatorOutput/ValidatorOutput";

export interface IYamlObjectValidator {
  validateObject(
    item: IYamlParsedFile,
    elementsMap: Map<string, IYamlParsedFile>,
    referencedObjectIds?: Set<string>
  ): ValidatorOutput;
}
