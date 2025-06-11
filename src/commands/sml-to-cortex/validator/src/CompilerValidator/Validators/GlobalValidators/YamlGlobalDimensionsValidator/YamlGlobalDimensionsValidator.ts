import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import { IYamlDimension } from "models/src/yaml/IYamlDimension";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import { getAllDimensions } from "models/src/yaml/utils/YamlParsedFilesUtil";
import { transformListToReadableString } from "utils/string/string.util";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import { ICompilerValidatorFn } from "../../../ICompilerValidator";
import { IYamlDegenerateDimensionUtil } from "../../Utils/IYamlDegenerateDimensionUtil";
import { DimensionCircularReferenceValidator } from "./DimensionCircularReferenceValidator";

export const globalDimensionsErrors = {
  getDuplicateDegenerateDimensionsWarning(datasetKeyColumns: string, dimensions: Array<string>): string {
    return `The "${datasetKeyColumns}" combination is used in multiple degenerate dimensions: ${transformListToReadableString(dimensions)}.`;
  },
  getRelationshipInDimensionError: ({ object, orphanType }: { object: string; orphanType: ObjectType[number] }) =>
    `There is an unrelated ${orphanType} in the dimension - "${object || "unknown"}".`,
};

export class YamlGlobalDimensionsValidator implements ICompilerValidatorFn {
  private constructor(
    private readonly yamlDegenerateDimensionUtil: IYamlDegenerateDimensionUtil,
    private readonly dimensionCircularReferenceValidator = new DimensionCircularReferenceValidator()
  ) {}

  static create(yamlDegenerateDimensionUtil: IYamlDegenerateDimensionUtil): YamlGlobalDimensionsValidator {
    return new YamlGlobalDimensionsValidator(yamlDegenerateDimensionUtil);
  }

  validate(yamlParsedFiles: IYamlParsedFile<IYamlObject>[]): ValidatorOutput {
    const validatorOutput = ValidatorOutput.create();

    this.verifyDimensionFiles(yamlParsedFiles, validatorOutput);

    return validatorOutput;
  }

  private verifyDimensionFiles(
    yamlParsedFiles: IYamlParsedFile<IYamlObject>[],
    validatorOutput: ValidatorOutput,
    getDimensions: (
      yamlParsedFiles: IYamlParsedFile<IYamlObject>[]
    ) => IYamlParsedFile<IYamlDimension>[] = getAllDimensions
  ) {
    const dimensions = getDimensions(yamlParsedFiles);

    this.verifyDegenerateDimensions(dimensions, validatorOutput);
    this.dimensionCircularReferenceValidator.checkDependencyCycles(dimensions, validatorOutput);
  }

  private verifyDegenerateDimensions(dimensions: IYamlParsedFile<IYamlDimension>[], validatorOutput: ValidatorOutput) {
    const duplicateDegenerateDimensionsList =
      this.yamlDegenerateDimensionUtil.getDuplicatedDegenerateDimensions(dimensions);

    duplicateDegenerateDimensionsList.forEach((group, key) => {
      if (group.length > 1) {
        group.forEach((x) =>
          validatorOutput.file(x).addWarning(
            globalDimensionsErrors.getDuplicateDegenerateDimensionsWarning(
              key,
              group.map((d) => d.data.unique_name)
            )
          )
        );
      }
    });
  }
}
