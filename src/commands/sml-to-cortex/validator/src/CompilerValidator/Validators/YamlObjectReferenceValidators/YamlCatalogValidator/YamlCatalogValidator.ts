import IYamlParsedFile from "models/src/IYamlParsedFile";
import { IYamlCatalog } from "models/src/yaml/IYamlCatalog";
import { IYamlObject } from "models/src/yaml/IYamlObject";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import { IYamlObjectValidator } from "../../IYamlObjectValidator";
import { YamlModelValidator } from "../YamlModelValidator/YamlModelValidator";

export class YamlCatalogValidator implements IYamlObjectValidator {
  constructor(private readonly yamlModelValidator: YamlModelValidator) {}

  validateObject(
    item: IYamlParsedFile<IYamlCatalog>,
    elementsMap: Map<string, IYamlParsedFile<IYamlObject>>
  ): ValidatorOutput {
    const validatorOutput = ValidatorOutput.create();

    this.yamlModelValidator.validateDatasetsProperties(validatorOutput, item, elementsMap);

    return validatorOutput;
  }
}
