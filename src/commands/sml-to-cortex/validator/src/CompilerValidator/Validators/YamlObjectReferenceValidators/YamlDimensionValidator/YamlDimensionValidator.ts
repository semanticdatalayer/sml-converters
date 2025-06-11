import { OutputCompilationType, OutputValidationType } from "models/src/IFileCompilationOutputContext";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import TypeGuardUtil from "models/src/yaml/guards/type-guard-util";
import YamlDatasetTypeGuard from "models/src/yaml/guards/YamlDatasetTypeGuard";
import YamlDimensionTypeGuard from "models/src/yaml/guards/YamlDimensionTypeGuard";
import {
  FormatStringMap,
  formatStringMap,
  formatStringMapValues,
  INTEGRAL_FORMAT_STRINGS,
  IYamlDataset,
  IYamlDatasetColumn,
  IYamlDatasetColumnDerived,
  IYamlDatasetColumnSimple,
  YamlColumnDataType,
} from "models/src/yaml/IYamlDataset";
import {
  IDimensionalAttribute,
  IYamlDimension,
  IYamlDimensionHierarchy,
  IYamlDimensionLevel,
  IYamlDimensionLevelAttribute,
  IYamlDimensionMetric,
  IYamlDimensionRelationship,
  IYamlDimensionSecondaryAttribute,
  IYamlDimensionType,
  IYamlEmbeddedRelationship,
  IYamlLevelAliasAttribute,
  IYamlLevelParallelPeriod,
  IYamlSnowflakeRelationship,
  YamlDimensionTimeUnit,
} from "models/src/yaml/IYamlDimension";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import Guard from "utils/Guard";
import { transformListToReadableString } from "utils/string/string.util";

import ColumnDataTypeUtil from "../../../../utils/column-data-type.util";
import ValidatorOutput, { FileOutputAppender } from "../../../../ValidatorOutput/ValidatorOutput";
import IExpressionValidator from "../../ExpressionValidator/IExpressionValidator";
import { IYamlObjectValidator } from "../../IYamlObjectValidator";
import IYamlErrorContextUtil from "../IYamlErrorContexUtil";
import IYamlCommonReferenceValidator from "../YamlCommonReferenceValidator/IYamlCommonReferenceValidator";
import YamlErrorContextUtil from "../YamlErrorContextUtil";
import YamlValidatorUtil from "../YamlValidatorUtil";
import { IYamlDimensionValidationInput } from "./IYamlDimensionValidator";

type YamlAttributeOrAlias = IYamlDimensionSecondaryAttribute | IYamlDimensionMetric | IYamlLevelAliasAttribute;

interface IHierarchyNames {
  hierarchyName: string;
  levelName: string;
  attributeType: string;
}

interface IYamlDimensionError {
  attribute: YamlAttributeOrAlias;
  colType: YamlColumnDataType;
  hierarchy?: IHierarchyNames;
}

export type GetError<T extends IYamlDimensionRelationship> = (item: T, itemCount: number) => string;

/**
 * Functions isIYamlDimensionMetric() and getColumnName() should be deleted
 * While the following ticked https://atscale.atlassian.net/wiki/spaces/MOD/pages/3045621812/Consistency+in+yaml+metrics+name+columns is being implemented.
 */
const isIYamlDimensionMetric = (input: YamlAttributeOrAlias): input is IYamlDimensionMetric => {
  return TypeGuardUtil.hasProps<IYamlDimensionMetric>(input, "column");
};

const getColumnName = (attribute: YamlAttributeOrAlias): string => {
  if (isIYamlDimensionMetric(attribute)) {
    return attribute.column;
  }

  return attribute.name_column;
};

export const getErrorForDifferentColumnTypes = (
  mapGroup: Map<string, (IYamlDatasetColumnSimple | IYamlDatasetColumnDerived)[]>
) => {
  let errorDetails = "";
  mapGroup.forEach((columns, dataType) => {
    const columnNames = columns.map((column) => column.name).join(", ");
    errorDetails += `Column: "${columnNames}" with data type: ${dataType}. `;
  });

  return errorDetails;
};

const levelOrAttributeMsg = (input?: IHierarchyNames): string => {
  return input
    ? `Hierarchy "${input.hierarchyName}" with Level "${input.levelName}" with ${input.attributeType}`
    : "Level";
};

export const yamlDimensionErrors = {
  notExistingCol: (column: string, dataset: string): string =>
    `Non-existing column "${column}" in dataset "${dataset}"`,
  notApplicableFormatForColType: (input: IYamlDimensionError): string =>
    `Inapplicable formatting for column data_type. ${levelOrAttributeMsg(input.hierarchy)} "${
      input.attribute.unique_name
    }" should not have format property set for column type "${input.colType}" with name "${getColumnName(
      input.attribute
    )}"`,
  formatNotCompatibleWithColType: (input: IYamlDimensionError, formatMap: FormatStringMap): string =>
    `Incompatible formatting for related column data_type. ${levelOrAttributeMsg(input.hierarchy)} "${
      input.attribute.unique_name
    }" with format "${input.attribute.format}" is incompatible with "${input.colType}" for column "${getColumnName(
      input.attribute
    )}". Possible formats: ${formatMap[input.colType].join(", ")}`,
  duplicateSnowflakeRelationshipsMessage: (relationship: IYamlSnowflakeRelationship, duplicateCount: number) =>
    `There are ${duplicateCount} relationships with the same definition. From dataset: ${
      relationship.from.dataset
    } with join columns: [${relationship.from.join_columns.join(",")}] to level: ${relationship.to.level}`,
  duplicateEmbeddedRelationshipsMessage: (relationship: IYamlEmbeddedRelationship, duplicateCount: number) =>
    `There are ${duplicateCount} relationships with the same definition. From dataset: ${
      relationship.from.dataset
    } with join columns: [${relationship.from.join_columns.join(",")}], hierarchy: ${
      relationship.from.hierarchy
    } and level: ${relationship.from.level} to dimension: ${relationship.to.dimension} and level: ${
      relationship.to.level
    }`,
  formatNotCompatibleWithMetric: (metricName: string, format: string): string =>
    `Incompatible format(${format}) for metric "${metricName}". Possible formats: ${INTEGRAL_FORMAT_STRINGS.join(
      ", "
    )}`,
  missingRelationshipHierarchy: (hierarchyName: string): string => `Non-existing hierarchy named "${hierarchyName}"`,
  invalidCalcMemberExpression: (expression: string): string => `Invalid calculated member expression: ${expression}`,
  duplicateCalcMemberNameInCalcGroup: (calcGroupName: string): string =>
    `There are calculated members with duplicated names in "${calcGroupName}" calculation group`,
  timeUnitPropDetectedInLevel: (hierarchyName: string, levelName: string): string =>
    `Property "time_unit" detected in hierarchy: "${hierarchyName}" with level: "${levelName}"`,
  customEmptyMemberSortNameMissing: (unique_name: string, outputCompilationType: OutputCompilationType): string =>
    `Custom empty member should have sort_name property when sort_column is set. Affected ${outputCompilationType}: "${unique_name}"`,
  timeUnitMissingInTimeDimension: (levelName: string): string =>
    `Level "${levelName}" is part of a time dimension but property "time_unit" is missing`,
  sharedDegenerateLevelColumnsError: (columnType: string, levelUniqueName: string, affectedColumns: string): string =>
    `${columnType} for a level in a shared degenerate dimension should have the same data type. Affected level: ${levelUniqueName}. ${affectedColumns}`,
  invalidLevelAttributeReference: (
    hierarchyInput: { unique_name: string; label: string; index: number },
    level: string
  ) => {
    const hierarchyIdentifier =
      hierarchyInput.unique_name !== undefined
        ? `unique_name="${hierarchyInput.unique_name}"`
        : hierarchyInput.label != undefined
          ? `label="${hierarchyInput.label}"`
          : `index=${hierarchyInput.index}`;
    return `hierarchy[${hierarchyIdentifier}], level "${level}" has no corresponding level_attribute definition`;
  },
  invalidTimeUnitLevelOrder: (input: { hierarchyName: string; levelName: string }) =>
    `hierarchy[${input.hierarchyName}], level "${input.levelName}" Time Units must be greater than or equal to the level below it (i.e. Hour -> Minute) in a time hierarchy`,
  duplicateDegenerateDimensionLevelAttributesMessage: (
    dataset: string,
    key_columns: string[],
    duplicateLevelAttributes: string[]
  ) =>
    `Dataset "${dataset}" and key columns "${key_columns.join(", ")}" combination is duplicated in level attributes: ${duplicateLevelAttributes.join(", ")}`,
  duplicateDegenerateDimensionLevelsMultipleDatasetsMessage: (datasets: string[], duplicateLevelAttributes: string[]) =>
    `There are duplicated level attributes (${duplicateLevelAttributes.join(", ")}) using the same datasets (${datasets.join(", ")}) and the same key columns.`,
  sharedLevelAttributesNotPointingToSameDatasets: (
    dataset: string,
    levelAttributesWithDataset: number,
    allLevelAttributes: number
  ) =>
    `Level attributes should point to the same datasets. Dataset "${dataset}" is being used in ${levelAttributesWithDataset} out of ${allLevelAttributes} level attributes.`,
  degenerateDimensionLevelAttributesTypeError: (levelsFromOneDataset: string[], levelsFromMultipleDatasets: string[]) =>
    `Level attributes in a degenerate dimension must be of the same type. The dimension has single dataset attributes: ${transformListToReadableString(levelsFromOneDataset)} and multiple datasets attributes: ${transformListToReadableString(levelsFromMultipleDatasets)}`,
  secondaryAttributeInMultipleDatasetLAError: (levelAttributeNames: string, secondaryAttribute: string) =>
    `Secondary attributes are not allowed for level attributes with multiple datasets in degenerate dimensions. Affected level "${levelAttributeNames}". Remove: "${secondaryAttribute}"`,
  numberOfSortColumnsInMultipleDatasetsDegenerateError: (levelAttribute: string) =>
    `Level "${levelAttribute}" only has a sort column for some of its datasets. Either all datasets should have a sort column, or none should have one.`,
  multipleDatasetsInNormalDimensionNotAllowed: (levelAttribute: string) =>
    `Only levels in a degenerate dimension can have multiple datasets. Property "shared_degenerate_columns" is not allowed for level "${levelAttribute}".`,
  referredLevelNameIsEqualToParenLevelError: (levelName: string, matchName: string) =>
    `The referred level name "${levelName}" is equal to parent level name "${matchName}".`,
  referredLevelNameIsNotInTheSameHierarchyError: (levelName: string) =>
    `The referred level name "${levelName}" in parallel period is not in the same hierarchy.`,
  parallelPeriodShouldBeUseOnlyInTimeDimensionError: () => "Parallel period should be use only in time dimension.",
  parallelPeriodKeyColumnIsNotExistInRelatedLevelDatasets: (keyColumn: string, dataset: string) =>
    `The parallel period key_column "${keyColumn}" does not exist in dataset "${dataset}"`,
};

export class YamlDimensionValidator implements IYamlObjectValidator {
  private readonly yamlCommonReferenceValidator: IYamlCommonReferenceValidator;
  private readonly expressionValidator: IExpressionValidator;
  private readonly yamlErrorContextUtil: IYamlErrorContextUtil;
  private readonly formatMap;
  constructor(
    yamlCommonReferenceValidator: IYamlCommonReferenceValidator,
    expressionValidator: IExpressionValidator,
    yamlErrorContextUtil: IYamlErrorContextUtil,
    formatMap: FormatStringMap = formatStringMap
  ) {
    this.yamlCommonReferenceValidator = yamlCommonReferenceValidator;
    this.expressionValidator = expressionValidator;
    this.formatMap = formatMap;
    this.yamlErrorContextUtil = yamlErrorContextUtil;
  }

  validateObject(
    item: IYamlParsedFile<IYamlObject>,
    elementsMap: Map<string, IYamlParsedFile<IYamlObject>>,
    referencedObjectIds: Set<string>
  ): ValidatorOutput {
    const dimension = item.data as IYamlDimension;
    const validatorOutput = ValidatorOutput.create();

    this.verifyDegenerateDimsLevelTypes(dimension, validatorOutput.file(item));
    dimension.level_attributes.forEach((level) => {
      this.validateCustomEmptyMember(level, validatorOutput, item, OutputCompilationType.Level);
      this.validateTimeUnitProperty(level, dimension, validatorOutput, item);
      this.verifyNormalDimensionsHaveASingleDataset(level, dimension, validatorOutput.file(item));
      this.verifyDimensionDatasetsAndColumns({
        levelAttribute: level,
        item,
        validatorOutput,
        elementsMap,
        referencedObjectIds,
      });
      this.verifyLevelAttributesForDegenerateDim(level, dimension, validatorOutput.file(item));
    });

    validatorOutput.append(
      this.yamlCommonReferenceValidator.validateRelationships(item, elementsMap, referencedObjectIds)
    );

    if (dimension.relationships) {
      this.validateUniqueRelationships(
        validatorOutput.file(item),
        dimension.relationships.filter(YamlDimensionTypeGuard.isEmbeddedRelation),
        yamlDimensionErrors.duplicateEmbeddedRelationshipsMessage
      );
      this.validateUniqueRelationships(
        validatorOutput.file(item),
        dimension.relationships.filter(YamlDimensionTypeGuard.isSnowflakeRelation),
        yamlDimensionErrors.duplicateSnowflakeRelationshipsMessage
      );
      this.validateRelationshipHierarchy(
        validatorOutput.file(item),
        dimension.relationships.filter(YamlDimensionTypeGuard.isEmbeddedRelation),
        dimension.hierarchies.map((h) => h.unique_name)
      );
    }

    dimension.calculation_groups?.forEach((cg) => {
      this.validateUniqueCalcMemberNameInCalcGroup(
        validatorOutput.file(item),
        cg.calculated_members.map((cm) => cm.unique_name),
        cg.unique_name
      );

      cg.calculated_members.forEach((cm) => {
        const expression = cm.expression;
        if (expression && !this.expressionValidator.areParenthesesValid(expression)) {
          validatorOutput.file(item).addError(yamlDimensionErrors.invalidCalcMemberExpression(expression));
        }
      });
    });

    dimension.hierarchies.forEach((h, index) =>
      h.levels.forEach((l, lIndex) => {
        const hierarchyAndLevelName = {
          hierarchyName: h.unique_name || h.label,
          levelName: l.unique_name,
        };

        if (l.parallel_periods) {
          this.validateParallelPeriodIsOnlyInTimeDimension(dimension, h.levels, validatorOutput.file(item));
          this.validateReferredLevelParallelPeriod(h, l, validatorOutput.file(item));

          this.validateParallelPeriodKeyColumnsExistsInTheRelatedLevelDatasets(
            dimension,
            l.parallel_periods,
            elementsMap,
            referencedObjectIds,
            item,
            validatorOutput
          );
        }

        const referenced_level_attribute = dimension.level_attributes.find((la) => la.unique_name === l.unique_name);
        if (!referenced_level_attribute) {
          const errorContext = new YamlErrorContextUtil().getLevelContext({
            hierarchyUniqueName: hierarchyAndLevelName.hierarchyName,
            validationType: OutputValidationType.notExistingLevelReference,
            itemUniqueName: l.unique_name,
            message: "no corresponding level_attribute definition",
          });
          validatorOutput
            .file(item)
            .addErrorWithContext(
              yamlDimensionErrors.invalidLevelAttributeReference({ ...h, index }, l.unique_name),
              errorContext
            );
        }

        if (
          this.timeUnitLevelHasOrderError(dimension.level_attributes, referenced_level_attribute, h.levels[lIndex - 1])
        ) {
          const errorContext = this.yamlErrorContextUtil.getLevelContext({
            hierarchyUniqueName: hierarchyAndLevelName.hierarchyName,
            validationType: OutputValidationType.invalidTimeUnitLevelOrder,
            itemUniqueName: hierarchyAndLevelName.levelName,
            message: "invalid time_unit level order",
          });
          validatorOutput
            .file(item)
            .addErrorWithContext(yamlDimensionErrors.invalidTimeUnitLevelOrder(hierarchyAndLevelName), errorContext);
        }

        l.secondary_attributes?.forEach((sa) => {
          this.validateDegenerateDimensionSecondaryAttribute(sa, l, dimension, validatorOutput.file(item));
          this.validateCustomEmptyMember(sa, validatorOutput, item, OutputCompilationType.SecondaryAttribute);

          const yamlDataset = this.getYamlDataset(sa.dataset, elementsMap, referencedObjectIds, item, validatorOutput);

          const hierarchyNames: IHierarchyNames = {
            ...hierarchyAndLevelName,
            attributeType: "secondary_attribute",
          };

          this.validateDatasetColumns(yamlDataset, sa, item, validatorOutput, hierarchyNames);
        });

        l.aliases?.forEach((al) => {
          const yamlDataset = this.getYamlDataset(al.dataset, elementsMap, referencedObjectIds, item, validatorOutput);

          const hierarchyNames: IHierarchyNames = {
            ...hierarchyAndLevelName,
            attributeType: "level_alias",
          };

          this.validateDatasetColumns(yamlDataset, al, item, validatorOutput, hierarchyNames);
        });

        l.metrics?.forEach((m) => {
          const yamlDataset = this.getYamlDataset(m.dataset, elementsMap, referencedObjectIds, item, validatorOutput);

          if (!yamlDataset) {
            return;
          }

          const column = this.getDatasetColumn(yamlDataset, m.column, item, validatorOutput);
          if (!column) {
            return;
          }

          if (YamlDatasetTypeGuard.hasColumnDataTypeProp(column)) {
            this.validateMetricFormatProperty(m, validatorOutput.file(item));
          }
        });

        if ("time_unit" in l) {
          validatorOutput
            .file(item)
            .addError(yamlDimensionErrors.timeUnitPropDetectedInLevel(h.unique_name, l.unique_name));
        }
      })
    );

    return validatorOutput;
  }

  getParallelLevelDatasets(
    dimension: IYamlDimension,
    parallelLevelName: string,
    elementsMap: Map<string, IYamlParsedFile<IYamlObject>>,
    referencedObjectIds: Set<string>,
    item: IYamlParsedFile<IYamlObject>,
    validatorOutput: ValidatorOutput
  ): Array<IYamlDataset> {
    const datasetNames = new Set<string>();

    dimension.level_attributes.forEach((la) => {
      if (la.unique_name !== parallelLevelName) return;

      if (YamlDimensionTypeGuard.isLevelWithMultipleDatasets(la)) {
        la.shared_degenerate_columns.forEach((sdc) => datasetNames.add(sdc.dataset));
      } else {
        datasetNames.add(la.dataset);
      }
    });

    return Array.from(datasetNames)
      .map((datasetName) => this.getYamlDataset(datasetName, elementsMap, referencedObjectIds, item, validatorOutput))
      .filter((dataset): dataset is IYamlDataset => dataset !== undefined);
  }

  validateParallelPeriodKeyColumnsExistsInTheRelatedLevelDatasets(
    dimension: IYamlDimension,
    parallelPeriods: Array<IYamlLevelParallelPeriod>,
    elementsMap: Map<string, IYamlParsedFile<IYamlObject>>,
    referencedObjectIds: Set<string>,
    item: IYamlParsedFile<IYamlObject>,
    validatorOutput: ValidatorOutput
  ) {
    parallelPeriods.forEach((pp) => {
      const parallelLevelYamlDatasets = this.getParallelLevelDatasets(
        dimension,
        pp.level,
        elementsMap,
        referencedObjectIds,
        item,
        validatorOutput
      );

      pp.key_columns.forEach((keyColumn) => {
        parallelLevelYamlDatasets.forEach((dataset) => {
          if (!dataset.columns.some((column) => column.name === keyColumn)) {
            validatorOutput
              .file(item)
              .addError(
                yamlDimensionErrors.parallelPeriodKeyColumnIsNotExistInRelatedLevelDatasets(
                  keyColumn,
                  dataset.unique_name
                )
              );
          }
        });
      });
    });
  }

  validateReferredLevelParallelPeriod(
    hierarchy: IYamlDimensionHierarchy,
    currentLevel: IYamlDimensionLevel,
    fileOutputAppender: FileOutputAppender
  ) {
    const parallelPeriods = Guard.ensure(currentLevel.parallel_periods, "Do not have parallel periods in level");
    const matchingLevels = parallelPeriods.filter((p) => p.level === currentLevel.unique_name);

    if (matchingLevels.length > 0) {
      matchingLevels.forEach((matchingLevel) => {
        fileOutputAppender.addError(
          yamlDimensionErrors.referredLevelNameIsEqualToParenLevelError(currentLevel.unique_name, matchingLevel.level)
        );
      });
    }

    const invalidLevels = parallelPeriods.filter((p) => !hierarchy.levels.some((l) => p.level === l.unique_name));

    if (invalidLevels.length > 0) {
      invalidLevels.forEach((invalidLevel) => {
        fileOutputAppender.addError(
          yamlDimensionErrors.referredLevelNameIsNotInTheSameHierarchyError(invalidLevel.level)
        );
      });
    }
  }

  validateParallelPeriodIsOnlyInTimeDimension(
    dimension: IYamlDimension,
    levels: Array<IYamlDimensionLevel>,
    fileOutputAppender: FileOutputAppender
  ) {
    if (dimension.type !== IYamlDimensionType.Time) {
      const parallelPeriod = levels.some((l) => l.parallel_periods !== undefined);
      if (parallelPeriod) {
        fileOutputAppender.addError(yamlDimensionErrors.parallelPeriodShouldBeUseOnlyInTimeDimensionError());
      }
    }
  }

  /**
   * Level attributes with multiple datasets in degenerate dimensions
   * are not allowed to have secondary attributes at the moment.
   * In old modeler, they are allowed but publishing does not work.
   */
  validateDegenerateDimensionSecondaryAttribute(
    sa: IYamlDimensionSecondaryAttribute,
    l: IYamlDimensionLevel,
    dimension: IYamlDimension,
    fileOutputAppender: FileOutputAppender
  ) {
    const foundLevel = dimension.level_attributes.find((la) => la.unique_name === l.unique_name);
    if (foundLevel && YamlDimensionTypeGuard.isLevelWithMultipleDatasets(foundLevel)) {
      fileOutputAppender.addError(
        yamlDimensionErrors.secondaryAttributeInMultipleDatasetLAError(l.unique_name, sa.unique_name)
      );
    }
  }

  /**
   * All level attributes in degenerate dimensions must be of the same type: single dataset or multiple datasets.
   */
  verifyDegenerateDimsLevelTypes(dimension: IYamlDimension, fileOutputAppender: FileOutputAppender) {
    if (!dimension.is_degenerate) {
      return;
    }

    const levelFromMultipleDatasets = dimension.level_attributes.filter((level) =>
      YamlDimensionTypeGuard.isLevelWithMultipleDatasets(level)
    );
    const levelFromOneDataset = dimension.level_attributes.filter((level) =>
      YamlDimensionTypeGuard.isLevelFromOneDataset(level)
    );

    if (levelFromMultipleDatasets.length === dimension.level_attributes.length) {
      // if all level attributes are of multiple datasets type, we need to check if they point to the same datasets
      this.verifySharedDegenerateDimsDatasetsUsage(dimension, fileOutputAppender);
    } else if (levelFromOneDataset.length === dimension.level_attributes.length) {
      // currently no validation is needed for single dataset level attributes
      return;
    } else {
      fileOutputAppender.addError(
        yamlDimensionErrors.degenerateDimensionLevelAttributesTypeError(
          levelFromOneDataset.map((la) => la.unique_name),
          levelFromMultipleDatasets.map((la) => la.unique_name)
        )
      );
    }
  }

  /**
   * All level attributes in shared degenеrate dimensions must point to the same datasets.
   */
  verifySharedDegenerateDimsDatasetsUsage(dimension: IYamlDimension, fileOutputAppender: FileOutputAppender) {
    if (!dimension.is_degenerate) {
      return;
    }

    const numberOfLevelAttributesInDimension = dimension.level_attributes.length;
    const levelAttributesGroupedByDataset = this.groupSharedLevelAttributesByDataset(dimension);
    levelAttributesGroupedByDataset.forEach((levelAttributes, dataset) => {
      if (levelAttributes.length !== numberOfLevelAttributesInDimension) {
        fileOutputAppender.addWarning(
          yamlDimensionErrors.sharedLevelAttributesNotPointingToSameDatasets(
            dataset,
            levelAttributes.length,
            numberOfLevelAttributesInDimension
          )
        );
      }
    });
  }

  groupSharedLevelAttributesByDataset(dimension: IYamlDimension): Map<string, Array<string>> {
    const levelAttributesGroupedByDataset = new Map<string, Array<string>>();
    if (!dimension.is_degenerate) {
      return levelAttributesGroupedByDataset;
    }

    dimension.level_attributes.forEach((level) => {
      if (YamlDimensionTypeGuard.isLevelWithMultipleDatasets(level)) {
        level.shared_degenerate_columns.forEach((sdc) => {
          if (!levelAttributesGroupedByDataset.has(sdc.dataset)) {
            levelAttributesGroupedByDataset.set(sdc.dataset, []);
          }

          const existingLevelAttribute = levelAttributesGroupedByDataset.get(sdc.dataset);
          if (existingLevelAttribute) {
            existingLevelAttribute.push(level.unique_name);
          }
        });
      }
    });

    return levelAttributesGroupedByDataset;
  }

  verifyNormalDimensionsHaveASingleDataset(
    levelAttribute: IYamlDimensionLevelAttribute,
    dimension: IYamlDimension,
    fileOutputAppender: FileOutputAppender
  ) {
    if (!dimension.is_degenerate && YamlDimensionTypeGuard.isLevelWithMultipleDatasets(levelAttribute)) {
      fileOutputAppender.addError(
        yamlDimensionErrors.multipleDatasetsInNormalDimensionNotAllowed(levelAttribute.unique_name)
      );
    }
  }

  verifyDimensionDatasetsAndColumns(input: IYamlDimensionValidationInput) {
    const { levelAttribute, item, validatorOutput, elementsMap, referencedObjectIds } = input;

    if (YamlDimensionTypeGuard.isLevelWithMultipleDatasets(levelAttribute)) {
      this.verifyMultipleDatasetsColumns(input);

      levelAttribute.shared_degenerate_columns.forEach((sdc) => {
        const yamlDataset = this.getYamlDataset(sdc.dataset, elementsMap, referencedObjectIds, item, validatorOutput);

        const attribute = {
          dataset: sdc.dataset,
          name_column: sdc.name_column,
          key_columns: sdc.key_columns,
          sort_column: sdc.sort_column,
          is_unique_key: sdc.is_unique_key,
          unique_name: levelAttribute.unique_name,
          label: levelAttribute.label,
        };

        this.validateDatasetColumns(yamlDataset, attribute, item, validatorOutput);
      });
    } else {
      const yamlDataset = this.getYamlDataset(
        levelAttribute.dataset,
        elementsMap,
        referencedObjectIds,
        item,
        validatorOutput
      );

      this.validateDatasetColumns(yamlDataset, levelAttribute, item, validatorOutput);
    }
  }

  getLevelAttributeColumnsByType(input: IYamlDimensionValidationInput) {
    const { levelAttribute, item, validatorOutput, elementsMap, referencedObjectIds } = input;

    const groupedKeyColumns: Array<IYamlDatasetColumnSimple | IYamlDatasetColumnDerived> = [];
    const groupedValueColumns: Array<IYamlDatasetColumnSimple | IYamlDatasetColumnDerived> = [];
    const groupedSortColumns: Array<IYamlDatasetColumnSimple | IYamlDatasetColumnDerived> = [];

    if (YamlDimensionTypeGuard.isLevelWithMultipleDatasets(levelAttribute)) {
      levelAttribute.shared_degenerate_columns.forEach((sdc) => {
        const yamlDataset = this.getYamlDataset(sdc.dataset, elementsMap, referencedObjectIds, item, validatorOutput);
        if (!yamlDataset) {
          return;
        }
        const keyColumn = this.getSharedDegenerateDimensionColumn(yamlDataset, sdc.key_columns[0], input);
        const valueColumn = this.getSharedDegenerateDimensionColumn(yamlDataset, sdc.name_column, input);

        const sortColumn = sdc.sort_column
          ? this.getSharedDegenerateDimensionColumn(yamlDataset, sdc.sort_column, input)
          : undefined;

        if (!keyColumn || !valueColumn) {
          return;
        }
        groupedKeyColumns.push(keyColumn);
        groupedValueColumns.push(valueColumn);
        if (sortColumn) {
          groupedSortColumns.push(sortColumn);
        }
      });
    }

    return { groupedKeyColumns, groupedValueColumns, groupedSortColumns };
  }

  verifyMultipleDatasetsColumns(input: IYamlDimensionValidationInput) {
    const { levelAttribute } = input;
    if (YamlDimensionTypeGuard.isLevelWithMultipleDatasets(levelAttribute)) {
      const { groupedKeyColumns, groupedValueColumns, groupedSortColumns } = this.getLevelAttributeColumnsByType(input);
      this.validateSharedDegenerateDimensionColumn(groupedKeyColumns, "Key columns", input);
      this.validateSharedDegenerateDimensionColumn(groupedValueColumns, "Value columns", input);
      this.validateSharedDegenerateDimensionColumn(groupedSortColumns, "Sort columns", input);
      this.validateNumberOfSortColumnsColumn(
        groupedKeyColumns,
        groupedSortColumns,
        levelAttribute,
        input.item,
        input.validatorOutput
      );
    }
  }

  /**
   * A level attribute with multiple datasets must have sort columns
   * for all datasets or for none of the datasets.
   * Case 1: 0 sort columns
   * Case 2: number of sort columns = number of key columns
   */
  validateNumberOfSortColumnsColumn(
    groupedKeyColumns: Array<IYamlDatasetColumnSimple | IYamlDatasetColumnDerived>,
    groupedSortColumns: Array<IYamlDatasetColumnSimple | IYamlDatasetColumnDerived>,
    levelAttribute: IYamlDimensionLevelAttribute,
    item: IYamlParsedFile<IYamlObject>,
    validatorOutput: ValidatorOutput
  ) {
    if (groupedSortColumns.length !== 0 && groupedSortColumns.length !== groupedKeyColumns.length) {
      validatorOutput
        .file(item)
        .addError(yamlDimensionErrors.numberOfSortColumnsInMultipleDatasetsDegenerateError(levelAttribute.unique_name));
    }
  }

  validateSharedDegenerateDimensionColumn(
    groupedKeyColumns: Array<IYamlDatasetColumnSimple | IYamlDatasetColumnDerived>,
    columnType: string,
    input: IYamlDimensionValidationInput
  ) {
    const { levelAttribute, item, validatorOutput } = input;

    const mapGroup = YamlValidatorUtil.groupBy(groupedKeyColumns, (c) => [c.data_type]);
    if (mapGroup.size > 1) {
      validatorOutput
        .file(item)
        .addError(
          yamlDimensionErrors.sharedDegenerateLevelColumnsError(
            columnType,
            levelAttribute.unique_name,
            getErrorForDifferentColumnTypes(mapGroup)
          )
        );
    }
  }

  getSharedDegenerateDimensionColumn(
    yamlDataset: IYamlDataset,
    column: string,
    input: IYamlDimensionValidationInput
  ): IYamlDatasetColumnSimple | IYamlDatasetColumnDerived | undefined {
    const { item, validatorOutput } = input;

    const foundColumn = this.getDatasetColumn(yamlDataset, column, item, validatorOutput);
    if (!foundColumn) {
      return;
    }

    if (!YamlDatasetTypeGuard.hasColumnDataTypeProp(foundColumn)) {
      return;
    }

    return foundColumn;
  }

  verifyLevelAttributesForDegenerateDim(
    levelAttribute: IYamlDimensionLevelAttribute,
    dimension: IYamlDimension,
    fileOutputAppender: FileOutputAppender
  ) {
    if (!dimension.is_degenerate) return;
    const levelDataSources = this.getLevelDataSources(levelAttribute);

    const duplicatedLevelAttribute = dimension.level_attributes.filter((level) =>
      this.areTwoLevelDataSourcesEqual(levelDataSources, this.getLevelDataSources(level))
    );

    if (duplicatedLevelAttribute.length <= 1) return;

    if (levelDataSources.size === 1) {
      const [[dataset, keyColumns]] = Array.from(levelDataSources.entries());
      fileOutputAppender.addError(
        yamlDimensionErrors.duplicateDegenerateDimensionLevelAttributesMessage(
          dataset,
          keyColumns,
          duplicatedLevelAttribute.map((la) => la.unique_name)
        )
      );
    } else {
      const datasets = Array.from(levelDataSources.keys());
      fileOutputAppender.addError(
        yamlDimensionErrors.duplicateDegenerateDimensionLevelsMultipleDatasetsMessage(
          datasets,
          duplicatedLevelAttribute.map((la) => la.unique_name)
        )
      );
    }
  }

  private getLevelDataSources(levelAttribute: IYamlDimensionLevelAttribute): Map<string, string[]> {
    const levelDataSources = new Map<string, string[]>();

    if (YamlDimensionTypeGuard.isLevelFromOneDataset(levelAttribute)) {
      levelDataSources.set(levelAttribute.dataset, levelAttribute.key_columns);
    }

    if (YamlDimensionTypeGuard.isLevelWithMultipleDatasets(levelAttribute)) {
      levelAttribute.shared_degenerate_columns.forEach((dataSource) => {
        levelDataSources.set(dataSource.dataset, dataSource.key_columns);
      });
    }

    return levelDataSources;
  }

  areTwoLevelDataSourcesEqual(
    levelDataSources_1: Map<string, string[]>,
    levelDataSources_2: Map<string, string[]>
  ): boolean {
    if (levelDataSources_1.size !== levelDataSources_2.size) return false;

    return Array.from(levelDataSources_1.entries()).every(([dataset, columns]) => {
      const secondLevelDatasetColumns = levelDataSources_2.get(dataset);

      if (!secondLevelDatasetColumns) return false;

      if (columns.length !== secondLevelDatasetColumns.length) return false;

      const sourceColumnsSorted_1 = [...columns].sort();
      const sourceColumnsSorted_2 = [...secondLevelDatasetColumns].sort();

      return sourceColumnsSorted_1.every((column, index) => column === sourceColumnsSorted_2[index]);
    });
  }

  private validateDatasetColumns(
    yamlDataset: IYamlDataset | undefined,
    attribute: IYamlDimensionSecondaryAttribute,
    item: IYamlParsedFile<IYamlObject>,
    validatorOutput: ValidatorOutput,
    hierarchyNames?: IHierarchyNames
  ): void {
    if (!yamlDataset) return;

    attribute.key_columns?.forEach((keyColumn) => {
      this.getDatasetColumn(yamlDataset, keyColumn, item, validatorOutput);
    });

    if (attribute.sort_column) {
      this.getDatasetColumn(yamlDataset, attribute.sort_column, item, validatorOutput);
    }

    const nameColumn = this.getDatasetColumn(yamlDataset, attribute.name_column, item, validatorOutput);

    if (!nameColumn) return;
    if (!YamlDatasetTypeGuard.hasColumnDataTypeProp(nameColumn)) return;

    this.validateFormatProperty(attribute, nameColumn.data_type, item, validatorOutput, hierarchyNames);
  }

  private validateTimeUnitProperty(
    level: IYamlDimensionLevelAttribute,
    dimension: IYamlDimension,
    validatorOutput: ValidatorOutput,
    item: IYamlParsedFile<IYamlObject>
  ): void {
    if (dimension.type === IYamlDimensionType.Time && !level.time_unit) {
      validatorOutput.file(item).addErrorWithContext(
        yamlDimensionErrors.timeUnitMissingInTimeDimension(level.unique_name),
        this.yamlErrorContextUtil.getLevelAttributeContext({
          itemUniqueName: level.unique_name,
          message: "time_unit missing",
          validationType: OutputValidationType.timeUnit,
        })
      );
    }
  }

  private validateCustomEmptyMember(
    obj: IDimensionalAttribute | IYamlDimensionSecondaryAttribute | IYamlLevelAliasAttribute,
    validatorOutput: ValidatorOutput,
    item: IYamlParsedFile<IYamlObject>,
    outputCompilationType: OutputCompilationType
  ) {
    if (obj.custom_empty_member && YamlDimensionTypeGuard.isLevelFromOneDataset(obj)) {
      if (obj.sort_column && !obj.custom_empty_member.sort_name) {
        const getContext =
          outputCompilationType === OutputCompilationType.Level
            ? this.yamlErrorContextUtil.getLevelAttributeContext
            : this.yamlErrorContextUtil.getSecondaryAttributeContext;

        validatorOutput.file(item).addErrorWithContext(
          yamlDimensionErrors.customEmptyMemberSortNameMissing(obj.unique_name, outputCompilationType),
          getContext({
            itemUniqueName: obj.unique_name,
            message: "custom_empty_member missing sort key",
            validationType: OutputValidationType.customEmptyMember,
          })
        );
      }
    }
  }

  validateMetricFormatProperty(attribute: YamlAttributeOrAlias, fileOutputAppender: FileOutputAppender): void {
    if (!attribute.format) {
      return;
    }

    const formatStringNotCustom = formatStringMapValues(this.formatMap).find((f) => f === attribute.format);
    if (formatStringNotCustom && !INTEGRAL_FORMAT_STRINGS.includes(formatStringNotCustom)) {
      fileOutputAppender.addError(
        yamlDimensionErrors.formatNotCompatibleWithMetric(attribute.unique_name, attribute.format)
      );
    }
  }

  validateFormatProperty(
    attribute: YamlAttributeOrAlias,
    colType: string,
    item: IYamlParsedFile<IYamlObject>,
    validatorOutput: ValidatorOutput,
    hierarchyNames?: IHierarchyNames
  ): void {
    if (!attribute.format) {
      return;
    }
    const yamlColType = ColumnDataTypeUtil.getColumnTypeFromYaml(colType);
    if (!yamlColType) {
      // another validator should mark this error
      return;
    }
    const formatPropError: IYamlDimensionError = {
      attribute,
      colType: yamlColType,
      hierarchy: hierarchyNames,
    };

    if (!this.formatMap[yamlColType].length) {
      validatorOutput.file(item).addError(yamlDimensionErrors.notApplicableFormatForColType(formatPropError));
      return;
    }

    const formatStringNotCustom = formatStringMapValues(this.formatMap).find((f) => f === attribute.format);
    if (formatStringNotCustom && !this.formatMap[yamlColType].includes(formatStringNotCustom)) {
      validatorOutput
        .file(item)
        .addError(yamlDimensionErrors.formatNotCompatibleWithColType(formatPropError, this.formatMap));
    }
  }

  getYamlDataset(
    dataset: string,
    elementsMap: Map<string, IYamlParsedFile<IYamlObject>>,
    referencedObjectIds: Set<string>,
    item: IYamlParsedFile<IYamlObject>,
    validatorOutput: ValidatorOutput
  ): IYamlDataset | undefined {
    const referencedObject = this.yamlCommonReferenceValidator.validateAndGetReferencedObject(
      dataset,
      elementsMap,
      item,
      ObjectType.Dataset,
      validatorOutput
    );

    if (!referencedObject) {
      return;
    }

    referencedObjectIds.add(dataset);

    return referencedObject.data as IYamlDataset;
  }

  getDatasetColumn(
    dataset: IYamlDataset,
    colName: string,
    item: IYamlParsedFile<IYamlObject>,
    validatorOutput: ValidatorOutput
  ): IYamlDatasetColumn | undefined {
    const column = dataset.columns.find((x) => x.name === colName);
    if (!column) {
      validatorOutput.file(item).addError(yamlDimensionErrors.notExistingCol(colName, dataset.unique_name));
    }

    return column;
  }

  validateUniqueRelationships<T extends IYamlDimensionRelationship>(
    fileAppender: FileOutputAppender,
    relations: Array<T>,
    getError: GetError<T>
  ): void {
    const mapGroup = YamlValidatorUtil.groupBy(relations, (r) => Object.values(r.from).concat(Object.values(r.to)));
    YamlValidatorUtil.appendErrorsIfDuplicates(mapGroup, fileAppender, getError);
  }

  private validateRelationshipHierarchy(
    fileOutputAppender: FileOutputAppender,
    relationships: IYamlEmbeddedRelationship[],
    hierarchiesUniqueNames: string[]
  ) {
    relationships.forEach((r) => {
      if (!hierarchiesUniqueNames.includes(r.from.hierarchy)) {
        fileOutputAppender.addError(yamlDimensionErrors.missingRelationshipHierarchy(r.from.hierarchy));
      }
    });
  }

  private validateUniqueCalcMemberNameInCalcGroup(
    fileAppender: FileOutputAppender,
    groupCalcMembers: Array<string>,
    calcGroupName: string
  ): void {
    if (YamlValidatorUtil.checkIfDuplicateNameExists(groupCalcMembers)) {
      fileAppender.addError(yamlDimensionErrors.duplicateCalcMemberNameInCalcGroup(calcGroupName));
    }
  }

  private timeUnitLevelHasOrderError(
    levelAtributes: IYamlDimensionLevelAttribute[],
    currentLevelAttribute: IYamlDimensionLevelAttribute | undefined,
    previousLevel: IYamlDimensionLevel | undefined
  ) {
    if (!previousLevel || !currentLevelAttribute?.time_unit) return false;

    const timeUnits = Object.values(YamlDimensionTimeUnit);
    const currentLevelIndex = timeUnits.indexOf(currentLevelAttribute.time_unit);
    const previousLevelReferencedAttribute = levelAtributes.find((la) => la.unique_name === previousLevel.unique_name);

    let previousLevelIndex = -1;
    if (previousLevelReferencedAttribute?.time_unit) {
      previousLevelIndex = timeUnits.indexOf(previousLevelReferencedAttribute?.time_unit);
    }

    return (
      currentLevelIndex < previousLevelIndex &&
      previousLevelReferencedAttribute?.time_unit !== YamlDimensionTimeUnit.Undefined
    );
  }
}
