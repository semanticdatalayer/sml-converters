import { Severity } from "models/src/IFileCompilationOutput";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import YamlObjectTypeGuard from "models/src/yaml/guards/yaml-object-type-guard";
import { IYamlCompositeModel } from "models/src/yaml/IYamlCompositeModel";
import { IYamlDimension } from "models/src/yaml/IYamlDimension";
import { IYamlMeasureCalculated } from "models/src/yaml/IYamlMeasure";
import { IYamlModel, IYamlModelMetricsAndCalc } from "models/src/yaml/IYamlModel";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import { getAllDimensions, getAllModels, getAllParsedItems } from "models/src/yaml/utils/YamlParsedFilesUtil";
import extractMeasures from "utils/extractMeasures.util";

import { transformListToReadableString } from "../../../../../../utils/string/string.util";
import { isEqualCaseInsensitive } from "../../../../utils/compare.util";
import { convertCompositeModel } from "../../../../utils/composite-model/composite-model.util";
import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import {
  ModelQueryableMetric,
  YamlModelQueryNameResolver,
} from "../../../../YamlModelQueryNameResolver/YamlModelQueryNameResolver";
import { ICompilerValidatorFn } from "../../../ICompilerValidator";
import { IYamlDegenerateDimensionUtil } from "../../Utils/IYamlDegenerateDimensionUtil";
import YamlDegenerateDimensionUtil from "../../Utils/YamlDegenerateDimensionUtil";
import YamlValidatorUtil from "../../YamlObjectReferenceValidators/YamlValidatorUtil";
import { YamlModelCalcMeasuresCycleRefValidator } from "./YamlModelMeasuresCycleRefValidator/YamlModelCalcMeasuresCycleRefValidator";

export const globalModelsErrors = {
  missingModels: "Missing Model files in folder structure",
  getDuplicateMetricError(model: IYamlModel, input: Array<ModelQueryableMetric>): string {
    return `Duplicate query name detected in context of a model "${model.unique_name}". Query name: "${input[0]?.queryName}".`;
  },
  getCalcMeasureContainsANonExistingMeasure: (calcMeasureName: string, measureName: string): string =>
    `Calculated metric "${calcMeasureName}" expression contains a non-existing metric: "${measureName}".`,
  getDuplicatedDegeneratedDimensionsInModelError: (duplicatedDimensions: string[], key: string): string =>
    `Degenerate dimensions: ${transformListToReadableString(duplicatedDimensions)} are referred in the model, however, they have duplicated "${key}" combination. Please remove duplicates.`,
  getDuplicatedDegeneratedDimensionsInMultipleModelsError: (
    duplicatedDimensionsInModels: string[],
    uniqueModels: string[],
    key: string
  ): string =>
    `Degenerate dimensions: ${transformListToReadableString(duplicatedDimensionsInModels)} are referred in models: ${transformListToReadableString(uniqueModels)}, however, they have duplicated ${key} combination. Please remove duplicates.`,
  getRelationshipInModelError: ({ object, orphanType }: { object: string; orphanType: ObjectType[number] }) =>
    `There is an unrelated ${orphanType} in the model - "${object || "unknown"}".`,
};

export class YamlGlobalModelsValidator implements ICompilerValidatorFn {
  static create(
    yamlDegenerateDimensionUtil: IYamlDegenerateDimensionUtil = new YamlDegenerateDimensionUtil(),
    yamlModelQueryNameResolver: YamlModelQueryNameResolver = new YamlModelQueryNameResolver(),
    yamlModelCalcMeasuresCycleRefValidator: YamlModelCalcMeasuresCycleRefValidator = YamlModelCalcMeasuresCycleRefValidator.create()
  ): YamlGlobalModelsValidator {
    return new YamlGlobalModelsValidator(
      yamlDegenerateDimensionUtil,
      yamlModelQueryNameResolver,
      yamlModelCalcMeasuresCycleRefValidator
    );
  }

  private constructor(
    private readonly yamlDegenerateDimensionUtil: IYamlDegenerateDimensionUtil,
    private readonly yamlModelQueryNameResolver: YamlModelQueryNameResolver,
    private readonly yamlModelCalcMeasuresCycleRefValidator: YamlModelCalcMeasuresCycleRefValidator
  ) {}

  validate(yamlParsedFiles: IYamlParsedFile<IYamlObject>[]): ValidatorOutput {
    const validatorOutput = ValidatorOutput.create();

    this.verifyModelFiles(yamlParsedFiles, validatorOutput);

    return validatorOutput;
  }

  private async verifyModelFiles(
    yamlParsedFiles: IYamlParsedFile<IYamlObject>[],
    validatorOutput: ValidatorOutput,
    getModels: (
      yamlParsedFiles: IYamlParsedFile<IYamlObject>[]
    ) => IYamlParsedFile<IYamlModel | IYamlCompositeModel>[] = getAllModels,
    getAllItems: (
      yamlParsedFiles: IYamlParsedFile<IYamlObject>[]
    ) => Map<string, IYamlParsedFile<IYamlObject>> = getAllParsedItems
  ) {
    if (!yamlParsedFiles.find((file) => YamlObjectTypeGuard.isModel(file.data))) {
      validatorOutput.addGlobalOutput(Severity.Error, globalModelsErrors.missingModels);
      return;
    }

    const allItems = getAllItems(yamlParsedFiles);
    const models = getModels(yamlParsedFiles);

    models.forEach((file) => {
      const modelFile = convertCompositeModel(file, yamlParsedFiles) as IYamlParsedFile<IYamlModel>;
      const { metrics: queryableMetrics } = this.yamlModelQueryNameResolver.buildQueryableItems(modelFile, allItems);

      this.verifyAllQueryNameMetricsDuplicates(queryableMetrics, modelFile, validatorOutput);
      this.verifyModelCalculationMeasures({
        // pass original file metrics to avoid duplicated errors for Composite Model
        metrics: file.data.metrics || [],
        queryableMetrics,
        modelFile,
        allItems,
        validatorOutput,
      });

      this.verifyDegenerateDimensionsInAModel(modelFile, yamlParsedFiles, validatorOutput);
    });

    this.verifyDegenerateDimensionsInAllModels(models, yamlParsedFiles, validatorOutput);
  }

  verifyDegenerateDimensionsInAModel(
    modelFile: IYamlParsedFile<IYamlModel>,
    yamlParsedFiles: IYamlParsedFile<IYamlObject>[],
    validatorOutput: ValidatorOutput,
    getDimensions: (
      yamlParsedFiles: IYamlParsedFile<IYamlObject>[]
    ) => IYamlParsedFile<IYamlDimension>[] = getAllDimensions
  ) {
    if (!modelFile.data?.dimensions) {
      return;
    }

    const duplicateDegenerateDimensionsList = this.yamlDegenerateDimensionUtil.getDuplicatedDegenerateDimensions(
      getDimensions(yamlParsedFiles)
    );

    duplicateDegenerateDimensionsList.forEach((group, key) => {
      const dimensionsUsedInModels = this.findDegenerateDimsUsedInSingleModel(group, modelFile);

      if (dimensionsUsedInModels.length > 1) {
        validatorOutput
          .file(modelFile)
          .addWarning(globalModelsErrors.getDuplicatedDegeneratedDimensionsInModelError(dimensionsUsedInModels, key));
      }
    });
  }

  private findDegenerateDimsUsedInSingleModel(
    group: IYamlParsedFile<IYamlDimension>[],
    modelFile: IYamlParsedFile<IYamlModel>
  ): string[] {
    return group.reduce<string[]>((acc, duplicatedDimension) => {
      const dimension = modelFile.data.dimensions?.find((d) => d === duplicatedDimension.data.unique_name);
      if (dimension) {
        acc.push(dimension);
      }
      return acc;
    }, []);
  }

  verifyDegenerateDimensionsInAllModels(
    models: IYamlParsedFile<IYamlModel | IYamlCompositeModel>[],
    yamlParsedFiles: IYamlParsedFile<IYamlObject>[],
    validatorOutput: ValidatorOutput,
    getDimensions: (
      yamlParsedFiles: IYamlParsedFile<IYamlObject>[]
    ) => IYamlParsedFile<IYamlDimension>[] = getAllDimensions
  ) {
    const duplicateDegenerateDimensionsList = this.yamlDegenerateDimensionUtil.getDuplicatedDegenerateDimensions(
      getDimensions(yamlParsedFiles)
    );

    duplicateDegenerateDimensionsList.forEach((group, key) => {
      const { degenerateDimsUsedInModels, modelsWithDuplicatedDegenerateDims } =
        this.findDuplicatedDegenerateDimsInMultipleModels(group, models, yamlParsedFiles);

      const duplicatedDimensionsInModels = Array.from(new Set(degenerateDimsUsedInModels));
      const uniqueModels = Array.from(new Set(modelsWithDuplicatedDegenerateDims));

      if (duplicatedDimensionsInModels.length > 1) {
        uniqueModels.forEach((model) => {
          validatorOutput.file(model).addWarning(
            globalModelsErrors.getDuplicatedDegeneratedDimensionsInMultipleModelsError(
              duplicatedDimensionsInModels,
              uniqueModels.map((m) => m.data.unique_name),
              key
            )
          );
        });
      }
    });
  }

  private findDuplicatedDegenerateDimsInMultipleModels(
    group: IYamlParsedFile<IYamlDimension>[],
    models: IYamlParsedFile<IYamlModel | IYamlCompositeModel>[],
    yamlParsedFiles: IYamlParsedFile<IYamlObject>[]
  ): { degenerateDimsUsedInModels: string[]; modelsWithDuplicatedDegenerateDims: IYamlParsedFile<IYamlModel>[] } {
    const degenerateDimsUsedInModels: string[] = [];
    const modelsWithDuplicatedDegenerateDims: IYamlParsedFile<IYamlModel>[] = [];

    group.forEach((duplicatedDimension) => {
      models.forEach((model) => {
        const modelFile = convertCompositeModel(model, yamlParsedFiles) as IYamlParsedFile<IYamlModel>;

        if (modelFile.data.dimensions) {
          const degenerateDimension = modelFile.data.dimensions.find((d) => d === duplicatedDimension.data.unique_name);
          if (degenerateDimension) {
            degenerateDimsUsedInModels.push(duplicatedDimension.data.unique_name);
            modelsWithDuplicatedDegenerateDims.push(modelFile);
          }
        }
      });
    });

    return { degenerateDimsUsedInModels, modelsWithDuplicatedDegenerateDims };
  }

  verifyQueryNameMetricsDuplicates(
    queryableMetrics: ModelQueryableMetric[],
    modelFile: IYamlParsedFile<IYamlModel>,
    validatorOutput: ValidatorOutput
  ) {
    const metricsMapGroup = YamlValidatorUtil.groupBy(queryableMetrics, (q) => [q.queryName.toLowerCase()]);
    Array.from(metricsMapGroup.values())
      .filter((v) => v.length > 1)
      .forEach((x) =>
        validatorOutput.file(modelFile).addError(globalModelsErrors.getDuplicateMetricError(modelFile.data, x))
      );
  }

  private verifyAllQueryNameMetricsDuplicates(
    metrics: Array<ModelQueryableMetric>,
    modelFile: IYamlParsedFile<IYamlModel>,
    validatorOutput: ValidatorOutput
  ) {
    const duplicatesOutput = ValidatorOutput.create();
    this.verifyQueryNameMetricsDuplicates(metrics, modelFile, duplicatesOutput);
    validatorOutput.append(duplicatesOutput);
    if (!duplicatesOutput.hasErrors) {
      this.yamlModelCalcMeasuresCycleRefValidator.validate(metrics, modelFile, validatorOutput);
    }
  }

  private verifyModelCalculationMeasures({
    metrics,
    queryableMetrics,
    modelFile,
    allItems,
    validatorOutput,
  }: {
    metrics: Array<IYamlModelMetricsAndCalc>;
    queryableMetrics: Array<ModelQueryableMetric>;
    modelFile: IYamlParsedFile<IYamlModel>;
    allItems: Map<string, IYamlParsedFile>;
    validatorOutput: ValidatorOutput;
  }) {
    this.getModelCalculatedMetrics(
      allItems,
      metrics.map((m) => m.unique_name)
    ).forEach((cM) => {
      this.verifyExpressionMeasures(cM.data, queryableMetrics, modelFile, validatorOutput);
    });
  }

  getModelCalculatedMetrics(
    yamlParsedFiles: Map<string, IYamlParsedFile>,
    metrics: Array<string>
  ): IYamlParsedFile<IYamlMeasureCalculated>[] {
    return metrics.reduce((acc: IYamlParsedFile<IYamlMeasureCalculated>[], currentMetric) => {
      const metricFile = yamlParsedFiles.get(currentMetric);
      if (metricFile && YamlObjectTypeGuard.isMeasureCalc(metricFile.data)) {
        acc.push(metricFile as IYamlParsedFile<IYamlMeasureCalculated>);
      }

      return acc;
    }, []);
  }

  private verifyExpressionMeasures(
    modelCalcMeasure: IYamlMeasureCalculated,
    queryableMetrics: ModelQueryableMetric[],
    modelFile: IYamlParsedFile<IYamlModel>,
    validatorOutput: ValidatorOutput
  ) {
    extractMeasures(modelCalcMeasure.expression).forEach((measureName) => {
      const isMeasureIncluded = queryableMetrics.some((m) => isEqualCaseInsensitive(m.queryName, measureName));

      if (!isMeasureIncluded) {
        validatorOutput
          .file(modelFile)
          .addError(
            globalModelsErrors.getCalcMeasureContainsANonExistingMeasure(modelCalcMeasure.unique_name, measureName)
          );
      }
    });
  }
}
