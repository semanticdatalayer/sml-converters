import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import YamlModelTypeGuard from "models/src/yaml/guards/YamlModelTypeGuard";
import { IYamlCompositeModel } from "models/src/yaml/IYamlCompositeModel";
import { IYamlModel, IYamlModelMetricsAndCalc } from "models/src/yaml/IYamlModel";

import ValidatorOutput, { FileOutputAppender } from "../../../../ValidatorOutput/ValidatorOutput";
import { IYamlObjectValidator } from "../../IYamlObjectValidator";
import IYamlCommonReferenceValidator from "../YamlCommonReferenceValidator/IYamlCommonReferenceValidator";
import YamlValidatorUtil from "../YamlValidatorUtil";
import { yamlCompositeModelErrorMessages } from "./YamlCompositeModelValidatorMessages";

export class YamlCompositeModelValidator implements IYamlObjectValidator {
  constructor(private yamlCommonReferenceValidator: IYamlCommonReferenceValidator) {}

  validateObject(
    item: IYamlParsedFile,
    elementsMap: Map<string, IYamlParsedFile>,
    referencedObjectIds: Set<string>
  ): ValidatorOutput {
    const model = item.data as IYamlCompositeModel;
    const validatorOutput = ValidatorOutput.create();

    this.validateMetrics(item, model.metrics, elementsMap, referencedObjectIds, validatorOutput);
    this.validateModels(item, model, elementsMap, referencedObjectIds, validatorOutput);

    return validatorOutput;
  }

  private validateMetrics(
    file: IYamlParsedFile,
    metrics: Array<IYamlModelMetricsAndCalc> | undefined,
    elementsMap: Map<string, IYamlParsedFile>,
    referencedObjectIds: Set<string>,
    validatorOutput: ValidatorOutput
  ): void {
    metrics?.forEach((m) => {
      const referencedObject = this.yamlCommonReferenceValidator.validateAndGetReferencedObject(
        m.unique_name,
        elementsMap,
        file,
        ObjectType.MeasureCalc,
        validatorOutput
      );

      if (!referencedObject) {
        return;
      }

      referencedObjectIds.add(m.unique_name);
    });
  }

  private validateModels(
    file: IYamlParsedFile,
    model: IYamlCompositeModel,
    elementsMap: Map<string, IYamlParsedFile>,
    referencedObjectIds: Set<string>,
    validatorOutput: ValidatorOutput
  ): void {
    let allMetrics = model.metrics || [];
    let allDegenerateDimensions: string[] = [];
    let queryNameOverrides: string[] = [];
    const allRelationshipDimensions: Set<string>[] = [];

    model.models.forEach((m) => {
      const referencedObject = this.yamlCommonReferenceValidator.validateAndGetReferencedObject(
        m,
        elementsMap,
        file,
        ObjectType.Model,
        validatorOutput
      );

      if (!referencedObject) {
        return;
      }

      const referencedModel = referencedObject.data as IYamlModel;
      allMetrics = allMetrics.concat(referencedModel.metrics);
      allDegenerateDimensions = allDegenerateDimensions.concat(referencedModel.dimensions || []);
      queryNameOverrides = queryNameOverrides.concat(
        Object.values(referencedModel.overrides || []).map((v) => v.query_name)
      );
      allRelationshipDimensions.push(
        new Set(
          referencedModel.relationships
            .map((r) => (YamlModelTypeGuard.isRegularRelation(r) ? r.to.dimension : ""))
            .filter((d) => d)
        )
      );

      referencedObjectIds.add(m);
    });

    const fileAppender = validatorOutput.file(file);
    this.validateUniqueMetrics(fileAppender, allMetrics);
    this.validateUniqueDegenerateDimensions(fileAppender, allDegenerateDimensions);
    this.validateUniqueQueryNameOverrides(fileAppender, queryNameOverrides);
    this.validateCommonRelationshipDimension(fileAppender, allRelationshipDimensions);
  }

  private validateUniqueMetrics(fileAppender: FileOutputAppender, metrics: Array<IYamlModelMetricsAndCalc>): void {
    const mapGroup = YamlValidatorUtil.groupBy(metrics, (r) => [r.unique_name]);

    YamlValidatorUtil.appendErrorsIfDuplicates(
      mapGroup,
      fileAppender,
      yamlCompositeModelErrorMessages.getDuplicateMetricUniqueNames
    );
  }

  private validateUniqueDegenerateDimensions(fileAppender: FileOutputAppender, dimensions: Array<string>): void {
    const mapGroup = YamlValidatorUtil.groupBy(dimensions, (r) => [r]);

    YamlValidatorUtil.appendErrorsIfDuplicates(
      mapGroup,
      fileAppender,
      yamlCompositeModelErrorMessages.getDuplicateDimensionUniqueNames
    );
  }

  private validateCommonRelationshipDimension(fileAppender: FileOutputAppender, dimensions: Set<string>[]): void {
    if (dimensions.length < 2) {
      return;
    }

    const commonDimension = YamlValidatorUtil.findCommonElement(dimensions);

    if (!commonDimension) {
      fileAppender.addError(yamlCompositeModelErrorMessages.commonRelationshipDimension);
    }
  }

  private validateUniqueQueryNameOverrides(fileAppender: FileOutputAppender, queryNameOverrides: Array<string>): void {
    const mapGroup = YamlValidatorUtil.groupBy(queryNameOverrides, (r) => [r]);

    YamlValidatorUtil.appendErrorsIfDuplicates(
      mapGroup,
      fileAppender,
      yamlCompositeModelErrorMessages.getDuplicateQueryNameOverrides
    );
  }
}
