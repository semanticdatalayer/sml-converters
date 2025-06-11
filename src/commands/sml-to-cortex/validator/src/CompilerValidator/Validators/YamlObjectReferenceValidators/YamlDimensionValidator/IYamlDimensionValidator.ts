import IYamlParsedFile from "models/src/IYamlParsedFile";
import { IYamlDimensionLevelAttribute } from "models/src/yaml/IYamlDimension";
import { IYamlObject } from "models/src/yaml/IYamlObject";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";

interface ValidationContext {
  item: IYamlParsedFile<IYamlObject>;
  validatorOutput: ValidatorOutput;
  elementsMap: Map<string, IYamlParsedFile<IYamlObject>>;
  referencedObjectIds: Set<string>;
}

export interface IYamlDimensionValidationInput extends ValidationContext {
  levelAttribute: IYamlDimensionLevelAttribute;
}
