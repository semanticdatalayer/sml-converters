import IYamlParsedFile from "models/src/IYamlParsedFile";
import { IYamlDimension } from "models/src/yaml/IYamlDimension";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import IYamlQueries from "models/src/yaml/IYamlQueries";
import { YamlQueries } from "models/src/yaml/YamlQueries";
import Guard from "utils/Guard";

import ValidatorOutput from "../../../ValidatorOutput/ValidatorOutput";
import { ICompilerValidatorFn } from "../../ICompilerValidator";
import YamlValidatorUtil from "../YamlObjectReferenceValidators/YamlValidatorUtil";

export const yamlGlobalProjectValidatorErrors = {
  duplicateCalcGroupNameInDimension: (): string => {
    return `There are Calculation Groups with duplicated names`;
  },
  duplicateCalcGroupNamesInDimensions: (duplicatedCalcGroupNames: Array<string>, comparedDimName: string): string => {
    const pluralSuffix = duplicatedCalcGroupNames.length > 1 ? "s" : "";
    return `Calculation Group${pluralSuffix} ${duplicatedCalcGroupNames.join(", ")} also occur in dimension: ${comparedDimName}`;
  },
};

export class YamlGlobalCalculationGroupValidator implements ICompilerValidatorFn {
  static create(yamlQueries: IYamlQueries = new YamlQueries()): YamlGlobalCalculationGroupValidator {
    return new YamlGlobalCalculationGroupValidator(yamlQueries);
  }

  private constructor(private readonly yamlQueries: IYamlQueries) {}

  validate(yamlParsedFiles: Array<IYamlParsedFile<IYamlObject>>): ValidatorOutput {
    const validatorOutput = ValidatorOutput.create();
    const usedDimensions = this.yamlQueries.getCatalogUsedDimensions(yamlParsedFiles);
    const mapCalcGroups = this.getMapCalcGroup(usedDimensions);

    this.validateCalcGroupNames(mapCalcGroups, usedDimensions, validatorOutput);
    return validatorOutput;
  }

  private getMapCalcGroup(yamlDimensionsFiles: Array<IYamlParsedFile<IYamlObject>>): Map<string, string[]> {
    return yamlDimensionsFiles.reduce((map, item) => {
      const dim = item.data as IYamlDimension;
      const key = dim.unique_name;
      const calcGroupNames = dim.calculation_groups?.map((cg) => cg.unique_name) || [];
      const values = [...(map.get(key) || []), ...calcGroupNames];
      map.set(key, values);
      return map;
    }, new Map<string, Array<string>>());
  }

  private validateCalcGroupNames(
    map: Map<string, string[]>,
    yamlDimensionsFiles: Array<IYamlParsedFile<IYamlObject>>,
    validatorOutput: ValidatorOutput
  ): void {
    map.forEach((currentCalcGroupNames, currentDim) => {
      const yamlDimFile = Guard.ensure(
        yamlDimensionsFiles.find((file) => (file.data as IYamlDimension).unique_name === currentDim),
        `Dimension file not exist`
      );

      if (YamlValidatorUtil.checkIfDuplicateNameExists(currentCalcGroupNames)) {
        validatorOutput
          .file(yamlDimFile)
          .addError(yamlGlobalProjectValidatorErrors.duplicateCalcGroupNameInDimension());
      }

      map.forEach((compareCalcGroupNames, compareDim) => {
        if (currentDim !== compareDim) {
          const duplicatedCalcGroupNames = compareCalcGroupNames.filter((name) => currentCalcGroupNames.includes(name));

          if (duplicatedCalcGroupNames.length > 0) {
            validatorOutput
              .file(yamlDimFile)
              .addError(
                yamlGlobalProjectValidatorErrors.duplicateCalcGroupNamesInDimensions(
                  duplicatedCalcGroupNames,
                  compareDim
                )
              );
          }
        }
      });
    });
  }
}
