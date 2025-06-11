import IYamlParsedFile from "models/src/IYamlParsedFile";
import { IYamlMeasureCalculated } from "models/src/yaml/IYamlMeasure";
import { IYamlModel } from "models/src/yaml/IYamlModel";
import extractMeasures from "utils/extractMeasures.util";
import Guard from "utils/Guard";

import ValidatorOutput, { FileOutputAppender } from "../../../../../ValidatorOutput/ValidatorOutput";
import {
  ModelQueryableMetric,
  ModelQueryableMetricType,
} from "../../../../../YamlModelQueryNameResolver/YamlModelQueryNameResolver";

export const yamlGlobalConnectionsValidatorErrors = {
  getCalcMeasureCycleReferenceError: (filePaths: Array<IYamlParsedFile>) =>
    `Cycle calculated measure reference detected. Reference path: ${filePaths.map((f) => f.data.unique_name).join("->")}`,
  getMeasureIsNotFoundByUniqueName: (uniqueName: string) =>
    `Cannot check cycle reference for measure with unique_name: ${uniqueName}. It was not found in the resolved queryable items`,
  getMeasureIsNotFoundByQueryName: (queryName: string) =>
    `Cannot check cycle reference for measure with model context resolved queryName: ${queryName}. It was not found in the resolved queryable items`,
};

export class YamlModelCalcMeasuresCycleRefValidator {
  static create(): YamlModelCalcMeasuresCycleRefValidator {
    return new YamlModelCalcMeasuresCycleRefValidator();
  }

  validate(
    queryableMeasures: ModelQueryableMetric[],
    modelFile: IYamlParsedFile<IYamlModel>,
    validatorOutput: ValidatorOutput
  ): void {
    const detectedRefCycles: Array<Array<IYamlParsedFile>> = [];
    modelFile.data.metrics.forEach((modelMeasure) => {
      const queryableMeasure = queryableMeasures.find((qm) => qm.uniqueName === modelMeasure.unique_name);
      if (!queryableMeasure) {
        validatorOutput
          .file(modelFile)
          .addWarning(yamlGlobalConnectionsValidatorErrors.getMeasureIsNotFoundByUniqueName(modelMeasure.unique_name));
        return;
      }
      if (queryableMeasure.type !== ModelQueryableMetricType.MetricCalc) {
        return;
      }
      const longestCycleDependency = this.getLongestCycleDependency(
        queryableMeasure,
        queryableMeasures,
        validatorOutput.file(modelFile),
        detectedRefCycles
      );
      if (longestCycleDependency) {
        detectedRefCycles.push(longestCycleDependency);
      }
    });
    detectedRefCycles.forEach((path) =>
      validatorOutput
        .file(modelFile)
        .addError(yamlGlobalConnectionsValidatorErrors.getCalcMeasureCycleReferenceError(path))
    );
  }

  getLongestCycleDependency(
    currentCalcMeasure: ModelQueryableMetric,
    queryableMeasures: ModelQueryableMetric[],
    fileOutputAppender: FileOutputAppender,
    detectedRefCycles: Array<Array<IYamlParsedFile>>,
    path: Array<IYamlParsedFile> = [],
    depth = 0
  ): Array<IYamlParsedFile> | undefined {
    Guard.ensure(depth < 50, `YamlModelCalcMeasuresCycleRefValidator max depth exceeded`);

    if (detectedRefCycles.flatMap((x) => x).some((x) => x.data.unique_name === currentCalcMeasure.uniqueName)) {
      // this reference cycle has already been detected
      return;
    }
    const newPath = [...path, currentCalcMeasure.file];
    if (path.find((x) => x.data.unique_name === currentCalcMeasure.uniqueName)) {
      return newPath;
    }

    const expression = (currentCalcMeasure.file as IYamlParsedFile<IYamlMeasureCalculated>).data.expression;
    if (expression) {
      const referencedMeasures = extractMeasures(expression);
      let longestCycleDependency: Array<IYamlParsedFile> = [];
      referencedMeasures.forEach((measureQueryName) => {
        const referencedMeasure = queryableMeasures.find(
          (qm) => qm.queryName.toLowerCase() === measureQueryName.toLowerCase()
        );
        if (!referencedMeasure) {
          fileOutputAppender.addWarning(
            yamlGlobalConnectionsValidatorErrors.getMeasureIsNotFoundByQueryName(measureQueryName)
          );
          return;
        }
        if (referencedMeasure.type !== ModelQueryableMetricType.MetricCalc) {
          return;
        }

        const currentCycleDependency = this.getLongestCycleDependency(
          referencedMeasure,
          queryableMeasures,
          fileOutputAppender,
          detectedRefCycles,
          newPath,
          depth + 1
        );
        if (currentCycleDependency && longestCycleDependency.length < currentCycleDependency.length) {
          longestCycleDependency = currentCycleDependency;
        }
      });
      return longestCycleDependency.length > 0 ? longestCycleDependency : undefined;
    }
  }
}
