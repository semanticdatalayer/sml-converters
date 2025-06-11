import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import YamlDatasetTypeGuard from "models/src/yaml/guards/YamlDatasetTypeGuard";
import YamlDimensionTypeGuard from "models/src/yaml/guards/YamlDimensionTypeGuard";
import {
  FormatStringMap,
  formatStringMap,
  formatStringMapValues,
  INTEGRAL_FORMAT_STRINGS,
  IYamlDataset,
  YamlColumnDataType,
} from "models/src/yaml/IYamlDataset";
import { IYamlDimension } from "models/src/yaml/IYamlDimension";
import { calcMethodsMap, IYamlMeasure } from "models/src/yaml/IYamlMeasure";
import { IYamlModel, IYamlModelRelationship } from "models/src/yaml/IYamlModel";
import { IYamlObject } from "models/src/yaml/IYamlObject";

import ColumnDataTypeUtil from "../../../../utils/column-data-type.util";
import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import { IYamlObjectValidator } from "../../IYamlObjectValidator";
import MeasureFormatValidator from "../MeasureFormatValidator";
import IYamlCommonReferenceValidator from "../YamlCommonReferenceValidator/IYamlCommonReferenceValidator";

const semiAdditiveErrorPrefix = "semi_additive ";

export const yamlMeasureErrors = {
  notExistingCol: (column: string, dataset: string): string =>
    `Missing dataset column. Column "${column}" does not exist in "${dataset}" dataset`,
  notApplicableFormatForColType: (measure: IYamlMeasure, colType: YamlColumnDataType): string =>
    `Inapplicable formatting for column data_type. Measure "${measure.unique_name}" should not have format property set for column type "${colType}" with name "${measure.column}"`,
  formatNotCompatibleWithColType: (
    measure: IYamlMeasure,
    colType: YamlColumnDataType,
    formatMap: FormatStringMap
  ): string =>
    `Incompatible formatting for related column data_type. Measure "${measure.unique_name}" with format "${
      measure.format
    }" is incompatible with "${colType}" for column "${measure.column}". ${formatMap[colType].length > 0 ? "Possible formats: " + formatMap[colType].join(", ") : ""}`,
  calcMethodNotCompatibleWithColumnType: (measure: IYamlMeasure, colType: YamlColumnDataType): string =>
    `Measure "${measure.unique_name}" with calculated_method "${measure.calculation_method}", requires different column data_type than "${colType}"`,
  semiAdditiveHasNoRelationshipsOrDegenerateDimensions: (): string =>
    `${semiAdditiveErrorPrefix} There should be at least one relationships or degenerate dimension in semi additive.`,
  semiAdditiveHasEmptyRelationship: (): string =>
    `${semiAdditiveErrorPrefix} Relationship in semi additive cannot be empty.`,
  semiAdditiveHasUnknownRelationship: (relationship: string, metricName: string) =>
    `${semiAdditiveErrorPrefix} Relationship "${relationship}" does not exist in any of the models containing the metric "${metricName}"`,
  semiAdditiveDegenerateDimensionHasUnknownLevel: (dimension: string, level: string) =>
    `${semiAdditiveErrorPrefix} Degenerate dimension ${dimension} references unknown level ${level}.`,
  modelHasNoValidAttributes: (model: string) =>
    `${semiAdditiveErrorPrefix} Model ${model} has no valid attributes for this measure.`,
  modelHasInvalidNestedRelationship: (model: string, relationships: string[]) =>
    `${semiAdditiveErrorPrefix} Relationship ${relationships.join(", ")} is invalid in model ${model}.`,
  semiAdditiveNestedRelationshipLengthExceeded: () =>
    `${semiAdditiveErrorPrefix} Semi-additive attributes are not supported in dimensions nested beyond two levels. You can reference semi-additive attributes in a dimension nested within another dimension (e.g., model -> dim 1 -> dim 2), but not in deeper levels (e.g., model -> dim 1 -> dim 2 -> dim 3)."`,
};

const MAX_RELATIONSHIP_NESTING_LENGTH = 2;

export class YamlMeasureValidator implements IYamlObjectValidator {
  private readonly yamlCommonReferenceValidator: IYamlCommonReferenceValidator;
  private readonly formatMap: FormatStringMap;

  constructor(
    yamlCommonReferenceValidator: IYamlCommonReferenceValidator,
    formatMap: FormatStringMap = formatStringMap
  ) {
    this.yamlCommonReferenceValidator = yamlCommonReferenceValidator;
    this.formatMap = formatMap;
  }

  validateObject(
    item: IYamlParsedFile<IYamlObject>,
    elementsMap: Map<string, IYamlParsedFile<IYamlObject>>,
    referencedObjectIds: Set<string>
  ): ValidatorOutput {
    const measure = item.data as IYamlMeasure;
    const validatorOutput = ValidatorOutput.create();

    if (measure.dataset) {
      const referencedObject = this.yamlCommonReferenceValidator.validateAndGetReferencedObject(
        measure.dataset,
        elementsMap,
        item,
        ObjectType.Dataset,
        validatorOutput
      );

      if (!referencedObject) {
        return validatorOutput;
      }

      referencedObjectIds.add(measure.dataset);

      const referencedDataset = referencedObject.data as IYamlDataset;
      const column = referencedDataset.columns.find((c) => c.name === measure.column);

      if (!column) {
        validatorOutput
          .file(item)
          .addError(yamlMeasureErrors.notExistingCol(measure.column, referencedObject.data.unique_name));
        return validatorOutput;
      }

      if (YamlDatasetTypeGuard.hasColumnDataTypeProp(column)) {
        const yamlColumnDataType = ColumnDataTypeUtil.getColumnTypeFromYaml(column.data_type);
        if (!yamlColumnDataType) {
          return validatorOutput;
        }

        const formatStringNotCustom = formatStringMapValues(this.formatMap).find((f) => f === measure.format);

        if (
          formatStringNotCustom &&
          !INTEGRAL_FORMAT_STRINGS.includes(formatStringNotCustom) &&
          !this.formatMap[yamlColumnDataType].find((f) => f === measure.format)
        ) {
          validatorOutput
            .file(item)
            .addError(yamlMeasureErrors.formatNotCompatibleWithColType(measure, yamlColumnDataType, this.formatMap));
        }

        this.validateCalcMethod(validatorOutput, item, yamlColumnDataType);
      }

      if (measure.semi_additive) {
        this.validateSemiAdditiveRelationships(validatorOutput, item, elementsMap);
      }
    }

    if (measure.format) {
      MeasureFormatValidator.validate(measure.format, item, validatorOutput);
    }

    return validatorOutput;
  }

  private validateSemiAdditiveRelationships(
    validatorOutput: ValidatorOutput,
    item: IYamlParsedFile<IYamlObject>,
    elementsMap: Map<string, IYamlParsedFile<IYamlObject>>
  ) {
    const measure = item.data as IYamlMeasure;

    if (
      measure.semi_additive?.relationships === undefined &&
      measure.semi_additive?.degenerate_dimensions === undefined
    ) {
      validatorOutput.file(item).addError(yamlMeasureErrors.semiAdditiveHasNoRelationshipsOrDegenerateDimensions());
      return;
    }

    if (
      measure.semi_additive?.degenerate_dimensions === undefined &&
      measure.semi_additive?.relationships?.length === 0
    ) {
      return validatorOutput.file(item).addError(yamlMeasureErrors.semiAdditiveHasEmptyRelationship());
    }

    const models: Array<{
      unique_name: string;
      relationships: IYamlModelRelationship[];
      degenerateDimensions: string[];
    }> = [];
    const dimensions: IYamlDimension[] = [];

    elementsMap.forEach((item) => {
      if (item.data.object_type === ObjectType.Model) {
        const model = item.data as IYamlModel;
        const isMetricUsedByModel = !!model.metrics.find((m) => m.unique_name === measure.unique_name);

        if (isMetricUsedByModel) {
          models.push({
            unique_name: model.unique_name,
            degenerateDimensions: model.dimensions ?? [],
            relationships: model.relationships,
          });
        }
      } else if (item.data.object_type === ObjectType.Dimension) {
        const dimension = item.data as IYamlDimension;
        dimensions.push(dimension);
      }
    });

    measure.semi_additive.relationships?.forEach((relationship) => {
      if (Array.isArray(relationship)) {
        if (relationship.length > MAX_RELATIONSHIP_NESTING_LENGTH) {
          validatorOutput.file(item).addError(yamlMeasureErrors.semiAdditiveNestedRelationshipLengthExceeded());
        }

        relationship.forEach((relationship) => {
          const isRelationshipValidInSomeModel =
            models.some((model) => model.relationships.map((r) => r.unique_name).includes(relationship)) ||
            dimensions.some((d) =>
              d.relationships?.find(
                (dr) => YamlDimensionTypeGuard.isEmbeddedRelation(dr) && dr.unique_name === relationship
              )
            );

          if (!isRelationshipValidInSomeModel) {
            validatorOutput
              .file(item)
              .addWarning(yamlMeasureErrors.semiAdditiveHasUnknownRelationship(relationship, measure.unique_name));
          }
        });

        // Validate whether all nested relationships within a relationship are valid within model. If not, add a warning
        models.forEach((m) => {
          const isRelationshipValidInModel = relationship.every((r) => {
            const isRelationshipInModel = m.relationships.map((r) => r.unique_name).includes(r);
            const isRelationshipInDimension = dimensions.some((d) =>
              d.relationships?.find((dr) => YamlDimensionTypeGuard.isEmbeddedRelation(dr) && dr.unique_name === r)
            );

            return isRelationshipInModel || isRelationshipInDimension;
          });

          if (!isRelationshipValidInModel) {
            validatorOutput
              .file(item)
              .addWarning(yamlMeasureErrors.modelHasInvalidNestedRelationship(m.unique_name, relationship));
          }
        });
      } else {
        const isRelationshipValidInSomeModel =
          models.some((model) => model.relationships.map((r) => r.unique_name).includes(relationship)) ||
          dimensions.some((d) =>
            d.relationships?.find(
              (dr) => YamlDimensionTypeGuard.isEmbeddedRelation(dr) && dr.unique_name === relationship
            )
          );

        if (!isRelationshipValidInSomeModel) {
          validatorOutput
            .file(item)
            .addWarning(yamlMeasureErrors.semiAdditiveHasUnknownRelationship(relationship, measure.unique_name));
        }
      }
    });

    if (measure.semi_additive.degenerate_dimensions) {
      measure.semi_additive.degenerate_dimensions.forEach((dg) => {
        const isLevelUnknownInSomeModel = models.every((m) => {
          const referencedDimension = dimensions.find(
            (d) => d.is_degenerate && d.unique_name === dg.name && m.degenerateDimensions.includes(dg.name)
          );

          if (!referencedDimension) return false;

          return !referencedDimension.level_attributes.find((l) => l.unique_name === dg.level);
        });

        if (isLevelUnknownInSomeModel) {
          validatorOutput
            .file(item)
            .addError(yamlMeasureErrors.semiAdditiveDegenerateDimensionHasUnknownLevel(dg.name, dg.level));

          return false;
        }
      });
    }

    // Checks if every model has at least one valid attribute, otherwise throw error
    models.forEach((model) => {
      let modelHasValidAttribute = false;

      measure.semi_additive?.relationships?.forEach((r) => {
        if (modelHasValidAttribute) return;

        if (Array.isArray(r)) {
          const isValidRelationship = r.every(
            (relationship) =>
              !!(
                model.relationships.find((mr) => mr.unique_name === relationship) ||
                dimensions.find((d) =>
                  d.relationships?.find(
                    (dr) => YamlDimensionTypeGuard.isEmbeddedRelation(dr) && dr.unique_name === relationship
                  )
                )
              )
          );

          if (isValidRelationship) modelHasValidAttribute = true;
        } else {
          const isValidRelationship =
            model.relationships.find((mr) => mr.unique_name === r) ||
            dimensions.find((d) =>
              d.relationships?.find((dr) => YamlDimensionTypeGuard.isEmbeddedRelation(dr) && dr.unique_name === r)
            );

          if (isValidRelationship) modelHasValidAttribute = true;
        }
      });

      measure.semi_additive?.degenerate_dimensions?.forEach((dg) => {
        if (modelHasValidAttribute) return;

        if (model.degenerateDimensions.find((d) => dg.name === d)) {
          modelHasValidAttribute = true;
        }
      });

      if (!modelHasValidAttribute) {
        validatorOutput.file(item).addError(yamlMeasureErrors.modelHasNoValidAttributes(model.unique_name));
      }
    });
  }

  private validateCalcMethod(
    validatorOutput: ValidatorOutput,
    item: IYamlParsedFile,
    columnDataType: YamlColumnDataType
  ): void {
    const measure = item.data as IYamlMeasure;

    if (!calcMethodsMap[columnDataType].includes(measure.calculation_method)) {
      validatorOutput
        .file(item)
        .addError(yamlMeasureErrors.calcMethodNotCompatibleWithColumnType(measure, columnDataType));
    }
  }
}
