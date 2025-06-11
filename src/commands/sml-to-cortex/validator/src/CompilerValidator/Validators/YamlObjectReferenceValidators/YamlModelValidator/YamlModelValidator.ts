import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import YamlModelTypeGuard from "models/src/yaml/guards/YamlModelTypeGuard";
import { IYamlCatalog } from "models/src/yaml/IYamlCatalog";
import { IYamlDimension } from "models/src/yaml/IYamlDimension";
import {
  IYamlModel,
  IYamlModelAggregate,
  IYamlModelMetricsAndCalc,
  IYamlModelOverride,
  IYamlQueryNameWithObjectType,
} from "models/src/yaml/IYamlModel";

import ValidatorOutput, { FileOutputAppender } from "../../../../ValidatorOutput/ValidatorOutput";
import { IYamlObjectValidator } from "../../IYamlObjectValidator";
import IYamlCommonReferenceValidator from "../YamlCommonReferenceValidator/IYamlCommonReferenceValidator";
import { yamlCommonReferenceMessages } from "../YamlCommonReferenceValidator/YamlCommonReferenceValidator";
import YamlValidatorUtil from "../YamlValidatorUtil";
import { yamlModelErrorMessages, yamlModelWarningMessages } from "./YamlModelValidatorMessages";

export class YamlModelValidator implements IYamlObjectValidator {
  private yamlCommonReferenceValidator: IYamlCommonReferenceValidator;

  constructor(yamlCommonReferenceValidator: IYamlCommonReferenceValidator) {
    this.yamlCommonReferenceValidator = yamlCommonReferenceValidator;
  }

  validateObject(
    item: IYamlParsedFile,
    elementsMap: Map<string, IYamlParsedFile>,
    referencedObjectIds: Set<string>
  ): ValidatorOutput {
    const model = item.data as IYamlModel;
    const validatorOutput = ValidatorOutput.create();
    const dimensionNames: Array<string> = [];
    model.relationships.forEach((rel) => {
      if (YamlModelTypeGuard.isRegularRelation(rel)) {
        dimensionNames.push(rel.to.dimension);
      }
    });

    this.validateMetrics(
      item as IYamlParsedFile<IYamlModel>,
      model.metrics,
      elementsMap,
      referencedObjectIds,
      validatorOutput
    );
    this.validateDimensions(validatorOutput, item, elementsMap, referencedObjectIds, false, dimensionNames);
    this.validateDimensions(validatorOutput, item, elementsMap, referencedObjectIds, true, model.dimensions);

    validatorOutput.append(
      this.yamlCommonReferenceValidator.validateRelationships(item, elementsMap, referencedObjectIds)
    );

    this.yamlCommonReferenceValidator.validateRelationshipsReferences(validatorOutput, item, elementsMap);

    this.validateUniqueRelationships(validatorOutput.file(item), model);
    this.validateUniqueMetrics(validatorOutput.file(item), model);
    this.validateOverrides(validatorOutput, item);
    this.validateDatasetsProperties(validatorOutput, item as IYamlParsedFile<IYamlModel>, elementsMap);

    const modelFile = item as IYamlParsedFile<IYamlModel>;

    this.validateAggregates(validatorOutput, modelFile, elementsMap);
    this.validateDrillTroughs(validatorOutput, modelFile, elementsMap);
    return validatorOutput;
  }

  validateDatasetsProperties(
    validatorOutput: ValidatorOutput,
    file: IYamlParsedFile<IYamlModel | IYamlCatalog>,
    elementsMap: Map<string, IYamlParsedFile>
  ) {
    if (file.data.dataset_properties) {
      Object.keys(file.data.dataset_properties).forEach((datasetName) => {
        const dataset = elementsMap.get(datasetName);
        if (!dataset) {
          validatorOutput.file(file).addError(yamlModelErrorMessages.getDatasetForPropertiesNotExist(datasetName));
        }
        if (dataset && dataset?.data.object_type !== ObjectType.Dataset) {
          validatorOutput.file(file).addError(yamlModelErrorMessages.getDatasetPropertiesIncorrectType(datasetName));
        }
      });
    }
  }

  private validateMetrics(
    file: IYamlParsedFile<IYamlModel>,
    metrics: Array<IYamlModelMetricsAndCalc>,
    elementsMap: Map<string, IYamlParsedFile>,
    referencedObjectIds: Set<string>,
    validatorOutput: ValidatorOutput
  ): void {
    metrics.forEach((m) => {
      const referencedObject = elementsMap.get(m.unique_name);
      if (!referencedObject) {
        validatorOutput
          .file(file)
          .addError(yamlCommonReferenceMessages.referenceObjectNotExist(ObjectType.Measure, m.unique_name));
        return;
      }

      if (
        referencedObject.data.object_type !== ObjectType.Measure &&
        referencedObject.data.object_type !== ObjectType.MeasureCalc
      ) {
        validatorOutput
          .file(file)
          .addError(
            yamlCommonReferenceMessages.incorrectReference(
              ObjectType.Measure,
              m.unique_name,
              referencedObject.data.object_type
            )
          );
        return;
      }

      referencedObjectIds.add(m.unique_name);
    });
  }

  private validateDimensions(
    validatorOutput: ValidatorOutput,
    file: IYamlParsedFile,
    elementsMap: Map<string, IYamlParsedFile>,
    referencedObjectIds: Set<string>,
    isDegenerate: boolean,
    dimensions?: Array<string>
  ): void {
    dimensions?.forEach((d) => {
      const referencedObject = this.yamlCommonReferenceValidator.validateAndGetReferencedObject(
        d,
        elementsMap,
        file,
        ObjectType.Dimension,
        validatorOutput
      );

      if (!referencedObject) {
        return;
      }

      const yamlDimension = referencedObject.data as IYamlDimension;
      if (!yamlDimension.is_degenerate) {
        yamlDimension.is_degenerate = false;
      }

      if (yamlDimension.is_degenerate !== isDegenerate) {
        validatorOutput.file(file).addError(yamlModelErrorMessages.getDimensionDegenerateError(isDegenerate, d));
      }

      if (referencedObject) {
        referencedObjectIds.add(d);
      }
    });
  }

  public validateAggregates(
    validatorOutput: ValidatorOutput,
    file: IYamlParsedFile<IYamlModel>,
    elementsMap: Map<string, IYamlParsedFile>
  ) {
    const aggregates = file.data.aggregates;

    if (aggregates) {
      this.validateUniqueAggregates(validatorOutput.file(file), aggregates);
      aggregates.forEach((aggr, index) => {
        const { attributes, metrics } = aggr;
        const sumOfAttributesAndMetrics = (attributes?.length ?? 0) + (aggr.metrics?.length ?? 0);
        if (sumOfAttributesAndMetrics < 1) {
          validatorOutput
            .file(file)
            .addError(`Aggregate ${aggr.unique_name} should have at leas one attribute or metric`);
        }
        if (attributes) {
          this.yamlCommonReferenceValidator.validateAttributesReferences(
            validatorOutput,
            file,
            elementsMap,
            attributes
          );
        }
        if (metrics) {
          this.yamlCommonReferenceValidator.validateMetricReferences(validatorOutput, file, elementsMap, metrics);
        }

        if (Object.keys(aggr).includes("target_connection")) {
          validatorOutput
            .file(file)
            .addWarning(yamlModelWarningMessages.getTargetConnectionWarning(aggr.unique_name || aggr.label, index));
        }
      });
    }
  }

  private validateDrillTroughs(
    validatorOutput: ValidatorOutput,
    file: IYamlParsedFile<IYamlModel>,
    elementsMap: Map<string, IYamlParsedFile>
  ) {
    const { drillthroughs } = file.data;

    if (drillthroughs) {
      drillthroughs.forEach((dt) => {
        const { attributes, metrics } = dt;
        if (attributes) {
          this.yamlCommonReferenceValidator.validateAttributesReferences(
            validatorOutput,
            file,
            elementsMap,
            attributes
          );
        }
        this.yamlCommonReferenceValidator.validateMetricReferences(validatorOutput, file, elementsMap, metrics);
      });
    }
  }

  validateUniqueRelationships(fileAppender: FileOutputAppender, model: IYamlModel): void {
    const mapGroup = YamlValidatorUtil.groupBy(model.relationships, (r) =>
      Object.values(r.from).concat(Object.values(r.to))
    );

    YamlValidatorUtil.appendErrorsIfDuplicates(
      mapGroup,
      fileAppender,
      yamlModelErrorMessages.getDuplicateRelationshipsMessage
    );

    const mapUniqueName = YamlValidatorUtil.groupBy(model.relationships, (r) => [r.unique_name]);

    YamlValidatorUtil.appendErrorsIfDuplicates(
      mapUniqueName,
      fileAppender,
      yamlModelErrorMessages.getDuplicateRelationshipsUniqueNameMessage
    );
  }

  validateUniqueMetrics(fileAppender: FileOutputAppender, model: IYamlModel): void {
    const mapGroup = YamlValidatorUtil.groupBy(model.metrics, (r) => [r.unique_name]);

    YamlValidatorUtil.appendErrorsIfDuplicates<IYamlModelMetricsAndCalc>(
      mapGroup,
      fileAppender,
      yamlModelErrorMessages.getDuplicateMetricUniqueNames
    );
  }

  validateUniqueAggregates(fileAppender: FileOutputAppender, aggregates: IYamlModelAggregate[]): void {
    const mapGroup = YamlValidatorUtil.groupBy(aggregates, (aggr) => [aggr.unique_name]);

    YamlValidatorUtil.appendErrorsIfDuplicates<IYamlModelAggregate>(
      mapGroup,
      fileAppender,
      yamlModelErrorMessages.getDuplicateAggregatesUniqueNames
    );
  }

  validateOverrides(validatorOutput: ValidatorOutput, file: IYamlParsedFile) {
    const model = file.data as IYamlModel;
    if (!model.overrides) {
      return;
    }

    const modelOverrides = model.overrides;
    validatorOutput.file(file).addInfo(yamlModelErrorMessages.overridesInfo);

    const modelMeasuresAndDimensions = model.metrics.map((m) => m.unique_name).concat(model.dimensions || []);

    Object.keys(modelOverrides)
      .filter((o) => !modelMeasuresAndDimensions.includes(o))
      .forEach((k) => {
        validatorOutput.file(file).addError(yamlModelErrorMessages.getOverrideNotReferencedInModel(k));
      });

    const allQueryNames = model.metrics
      .map((m) => this.getOverrideWithObjectType(m.unique_name, modelOverrides, ObjectType.Measure))
      .concat(
        model.dimensions?.map((d) => this.getOverrideWithObjectType(d, modelOverrides, ObjectType.Dimension)) || []
      );

    const mapGroup = YamlValidatorUtil.groupBy(allQueryNames, (q) => [q.query_name.toLowerCase()]);
    Array.from(mapGroup.values())
      .filter((v) => v.length > 1)
      .forEach((x) => {
        validatorOutput.file(file).addError(yamlModelErrorMessages.getOverridesDuplicateOnQueryNames(x));
      });
  }

  private getOverrideWithObjectType(
    uniqueName: string,
    modelOverrides: IYamlModelOverride,
    object_type: ObjectType
  ): IYamlQueryNameWithObjectType {
    const overridesKeys = Object.keys(modelOverrides);
    return overridesKeys.includes(uniqueName)
      ? { query_name: modelOverrides[uniqueName].query_name, unique_name: uniqueName, object_type }
      : { query_name: uniqueName, unique_name: uniqueName, object_type };
  }
}
