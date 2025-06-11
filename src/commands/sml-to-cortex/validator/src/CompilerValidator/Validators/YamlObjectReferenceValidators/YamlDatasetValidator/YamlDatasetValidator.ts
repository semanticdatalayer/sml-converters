import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import YamlDatasetTypeGuard from "models/src/yaml/guards/YamlDatasetTypeGuard";
import {
  IYamlDataset,
  IYamlDatasetColumn,
  IYamlDatasetColumnSimple,
  IYamlDatasetIncremental,
  YamlColumDataTypeWithPrecision,
  YamlColumnDataType,
} from "models/src/yaml/IYamlDataset";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import { DurationUtil } from "utils/duration.util";
import errorUtil from "utils/error.util";
import Guard from "utils/Guard";

import ColumnDataTypeUtil from "../../../../utils/column-data-type.util";
import ValidatorOutput, { FileOutputAppender } from "../../../../ValidatorOutput/ValidatorOutput";
import { IYamlObjectValidator } from "../../IYamlObjectValidator";
import IYamlCommonReferenceValidator from "../YamlCommonReferenceValidator/IYamlCommonReferenceValidator";
import YamlValidatorUtil from "../YamlValidatorUtil";

// in snowflake Int and Long are Decimal(38,0)
export const incrementalColumnTypeSnowflakeDecimal = YamlColumnDataType.Decimal + "(38,0)";

export const incrementalColumnTypes: string[] = [
  YamlColumnDataType.Long,
  YamlColumnDataType.Int,
  YamlColumnDataType.TimeStamp,
  YamlColumnDataType.DateTime,
  incrementalColumnTypeSnowflakeDecimal,
];

export const yamlDatasetErrors = {
  parentColNotExist: (name: string): string => `Parent column "${name}" does not exist`,
  parentColIsTheSame: (name: string): string => `Parent column "${name}" should not be the same column`,
  parentColNoParent: (name: string): string => `Parent column "${name}" should not have parent property set`,
  invalidDataType: (name: string, data_type: string): string =>
    `Column "${name}" has invalid data_type: "${data_type}". Supported data types are ${ColumnDataTypeUtil.allDataTypes.join(
      ","
    )}`,
  invalidPrecisionDataType: (name: string, data_type: string, yamlDataType: YamlColumDataTypeWithPrecision): string =>
    `Column "${name}" has invalid data_type: "${data_type}". Precision is not well formed. It should be "${yamlDataType}(x,y)"`,
  datasetReferencesSameTable: (name: string, path: string): string =>
    `There is another dataset referencing the same table/view. Unique name "${name}", filepath: "${path}"`,
  incrementColumnNotExist: (name: string) => `Referenced column "${name}" in incremental does not exist`,
  incrementColumnInvalidColumnType: (name: string) =>
    `Referenced column "${name}" type is invalid. Supported column types: ${incrementalColumnTypes.join(", ")}`,
  invalidGracePeriod: "Invalid incremental grace_period.",
  duplicateColumnName: (columnName: string, itemCount: number): string =>
    `Duplicate column name "${columnName}". ${itemCount} duplicate items found`,
};

export class YamlDatasetValidator implements IYamlObjectValidator {
  private yamlCommonReferenceValidator: IYamlCommonReferenceValidator;

  constructor(yamlCommonReferenceValidator: IYamlCommonReferenceValidator) {
    this.yamlCommonReferenceValidator = yamlCommonReferenceValidator;
  }

  validateObject(
    item: IYamlParsedFile<IYamlObject>,
    elementsMap: Map<string, IYamlParsedFile<IYamlObject>>,
    referencedObjectIds: Set<string>
  ): ValidatorOutput {
    const validatorOutput = ValidatorOutput.create();
    const dataset = item.data as IYamlDataset;
    const referecedObjectId = dataset.connection_id;

    this.validateConnectionAndAddReferenceObjectId(
      referecedObjectId,
      item,
      elementsMap,
      referencedObjectIds,
      validatorOutput
    );

    if (dataset.alternate !== undefined && YamlDatasetTypeGuard.isAlternateTable(dataset.alternate)) {
      this.validateConnectionAndAddReferenceObjectId(
        dataset.alternate.connection_id,
        item,
        elementsMap,
        referencedObjectIds,
        validatorOutput
      );
    }

    const withParent = dataset.columns.filter(YamlDatasetTypeGuard.isDerivedColumn);
    withParent.forEach((c) => {
      if (c.name === c.parent_column) {
        return validatorOutput.file(item).addError(yamlDatasetErrors.parentColIsTheSame(c.name));
      }

      const parent = dataset.columns.find((cc) => c.parent_column === cc.name);

      if (!parent) {
        validatorOutput.file(item).addError(yamlDatasetErrors.parentColNotExist(c.parent_column));
      }

      if (parent && YamlDatasetTypeGuard.isDerivedColumn(parent)) {
        validatorOutput.file(item).addError(yamlDatasetErrors.parentColNoParent(parent.name));
      }
    });

    dataset.columns.forEach((column) => {
      this.validateColumn(item, column, validatorOutput);
    });

    const datasetColumnNamesMapGroup = YamlValidatorUtil.groupBy(
      dataset.columns.map((x) => x.name),
      (c) => [c]
    );

    YamlValidatorUtil.appendErrorsIfDuplicates(
      datasetColumnNamesMapGroup,
      validatorOutput.file(item),
      yamlDatasetErrors.duplicateColumnName
    );

    const datasetsNoSqlPropFromSameConnection = Array.from(elementsMap.values()).filter((d) => {
      const element = d.data as IYamlDataset;
      return (
        element.object_type === ObjectType.Dataset &&
        element.table === dataset.table &&
        element.connection_id === dataset.connection_id &&
        element.unique_name !== dataset.unique_name &&
        !YamlDatasetTypeGuard.hasDatasetSqlProp(element)
      );
    });

    datasetsNoSqlPropFromSameConnection.forEach((d) =>
      validatorOutput
        .file(item)
        .addWarning(yamlDatasetErrors.datasetReferencesSameTable((d.data as IYamlDataset).unique_name, d.relativePath))
    );

    if (dataset.incremental) {
      this.validateIncremental(dataset.incremental, dataset.columns, validatorOutput.file(item));
    }

    return validatorOutput;
    //dataset.incremental ask Smilen, eventually verify column exists in columns
  }

  validateIncremental(
    incremental: IYamlDatasetIncremental,
    columns: IYamlDatasetColumn[],
    fileOutput: FileOutputAppender
  ) {
    const column = columns.find((c) => c.name === incremental.column) as IYamlDatasetColumnSimple;
    if (!column) {
      fileOutput.addError(yamlDatasetErrors.incrementColumnNotExist(incremental.column));
    }
    if (column?.data_type && !incrementalColumnTypes.includes(column?.data_type)) {
      fileOutput.addError(yamlDatasetErrors.incrementColumnInvalidColumnType(incremental.column));
    }

    try {
      const duration = DurationUtil.parse(incremental.grace_period);
      Guard.should(duration.value >= 0, `The duration should be greater than or equal to zero.`);
    } catch (e) {
      const err = `${yamlDatasetErrors.invalidGracePeriod} ${errorUtil.getErrorMessage(e)}`;
      fileOutput.addError(err);
    }
  }

  validateConnectionAndAddReferenceObjectId(
    refObjectId: string,
    item: IYamlParsedFile<IYamlObject>,
    elementsMap: Map<string, IYamlParsedFile<IYamlObject>>,
    referencedObjectIds: Set<string>,
    validatorOutput: ValidatorOutput
  ): void {
    const referenceObject = this.yamlCommonReferenceValidator.validateAndGetReferencedObject(
      refObjectId,
      elementsMap,
      item,
      ObjectType.Connection,
      validatorOutput
    );

    if (referenceObject) {
      referencedObjectIds.add(refObjectId);
    }
  }

  validateColumn(
    item: IYamlParsedFile<IYamlObject>,
    column: IYamlDatasetColumn,
    validatorOutput: ValidatorOutput
  ): void {
    if (YamlDatasetTypeGuard.hasColumnDataTypeProp(column)) {
      const yamlColumnType = ColumnDataTypeUtil.getColumnTypeFromYaml(column.data_type);
      if (!yamlColumnType) {
        validatorOutput.file(item).addError(yamlDatasetErrors.invalidDataType(column.name, column.data_type));
        return;
      }

      const yamlColumnTypeWithPrecision = ColumnDataTypeUtil.getColumnTypeWithPrecisionFromYaml(column.data_type);

      if (yamlColumnTypeWithPrecision !== undefined) {
        if (
          !ColumnDataTypeUtil.hasColumnExactMatch(column.data_type) &&
          !ColumnDataTypeUtil.isValidPrecisionFormat(column.data_type)
        ) {
          validatorOutput
            .file(item)
            .addError(
              yamlDatasetErrors.invalidPrecisionDataType(column.name, column.data_type, yamlColumnTypeWithPrecision)
            );
          return;
        }
      } else {
        if (!ColumnDataTypeUtil.hasColumnExactMatch(column.data_type)) {
          validatorOutput.file(item).addError(yamlDatasetErrors.invalidDataType(column.name, column.data_type));
        }
      }
    }
  }
}
