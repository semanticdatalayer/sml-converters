import { Severity } from "models/src/IFileCompilationOutput";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import YamlDimensionTypeGuard from "models/src/yaml/guards/YamlDimensionTypeGuard";
import { IYamlDimension } from "models/src/yaml/IYamlDimension";
import errorUtil from "utils/error.util";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";

export class DimensionCircularReferenceValidator {
  getDependencyCycleError(dependencyPath: Array<string>): string {
    return `Dependency cycle detected ${dependencyPath.join(" -> ")}`;
  }
  public checkDependencyCycles(dimensions: IYamlParsedFile<IYamlDimension>[], validatorOutput: ValidatorOutput) {
    try {
      const visitedDimensions = new Set<string>();

      dimensions.forEach((dim) => {
        this.traverseDimensions(dim, dimensions, validatorOutput, visitedDimensions);
      });
    } catch (e) {
      const message = errorUtil.getErrorMessage(e);
      validatorOutput.addGlobalOutput(Severity.Warning, `Dimension cycle dependency check failed. ${message}`);
    }
  }

  private traverseDimensions(
    currentDimension: IYamlParsedFile<IYamlDimension>,
    allDimensions: IYamlParsedFile<IYamlDimension>[],
    validatorOutput: ValidatorOutput,
    visitedDimensions: Set<string>,
    dependencyPath: Array<string> = []
  ) {
    const indexOfDimension = dependencyPath.indexOf(currentDimension.data.unique_name);
    const currentDependencyPath = [...dependencyPath, currentDimension.data.unique_name];
    if (indexOfDimension >= 0) {
      //we detected circular dependency
      validatorOutput
        .file(currentDimension)
        .addWarning(this.getDependencyCycleError(currentDependencyPath.slice(indexOfDimension)));
      return;
    }

    if (visitedDimensions.has(currentDimension.data.unique_name)) {
      // we already visited this dimension.
      return;
    }

    visitedDimensions.add(currentDimension.data.unique_name);

    //traverse child dimensions
    if (!currentDimension.data.relationships) {
      return;
    }
    (currentDimension.data.relationships || []).forEach((relation) => {
      if (YamlDimensionTypeGuard.isRegularRelation(relation) && YamlDimensionTypeGuard.isEmbeddedRelation(relation)) {
        const childDimension = allDimensions.find((d) => d.data.unique_name === relation.to.dimension);
        if (!childDimension) {
          // other validator handles this
          return;
        }
        this.traverseDimensions(
          childDimension,
          allDimensions,
          validatorOutput,
          visitedDimensions,
          currentDependencyPath
        );
      }
    });
  }
}
