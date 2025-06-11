import { IYamlFile } from "models/src/IYamlFile";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import IYamlQueries from "models/src/yaml/IYamlQueries";
import { YamlQueries } from "models/src/yaml/YamlQueries";

import ValidatorOutput from "../../../ValidatorOutput/ValidatorOutput";
import { ICompilerValidatorFn } from "../../ICompilerValidator";

export const yamlGlobalConnectionsValidatorErrors = {
  getMultiDwError: (name: string, dwConIds: Array<string>) =>
    `Multi data-warehouse connections are used in model "${name}". Only one datawarehouse should be used per model. Data-warehouse connection ids: ${dwConIds.join(
      ","
    )}`,
};

export class YamlGlobalConnectionsValidator implements ICompilerValidatorFn {
  static create(yamlQueries: IYamlQueries = new YamlQueries()): YamlGlobalConnectionsValidator {
    return new YamlGlobalConnectionsValidator(yamlQueries);
  }

  private constructor(private readonly yamlQueries: IYamlQueries) {}

  validate(elements: IYamlFile<IYamlObject>[]): ValidatorOutput {
    const objectIndex = this.yamlQueries.sortYamlModels(elements);
    const DwConnectionsPerModel = this.yamlQueries.getAllDataWarehouseConnectionsUsedInRepo(objectIndex);
    const result = ValidatorOutput.create();
    DwConnectionsPerModel.forEach((conIds, name) => {
      if (conIds.length > 1) {
        result.global().addError(yamlGlobalConnectionsValidatorErrors.getMultiDwError(name, conIds));
      }
    });

    return result;
  }
}
