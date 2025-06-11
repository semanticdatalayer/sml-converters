import {
  IYamlDataset,
  IYamlDatasetAlternateSql,
  IYamlDatasetAlternateTable,
  IYamlDatasetColumn,
  IYamlDatasetColumnDerived,
  IYamlDatasetColumnMap,
  IYamlDatasetColumnSimple,
} from "../IYamlDataset";
import TypeGuardUtil from "./type-guard-util";

export default class YamlDatasetTypeGuard {
  static isSimpleColumn(column: IYamlDatasetColumn): column is IYamlDatasetColumnSimple {
    return (
      TypeGuardUtil.hasProps<IYamlDatasetColumnSimple>(column, "data_type") &&
      TypeGuardUtil.hasNoProps<IYamlDatasetColumnDerived>(column, "parent_column")
    );
  }

  static isCalculatedColumn(column: IYamlDatasetColumn): column is IYamlDatasetColumnSimple {
    return (
      YamlDatasetTypeGuard.isSimpleColumn(column) &&
      (TypeGuardUtil.hasProps<IYamlDatasetColumnSimple>(column, "sql") ||
        TypeGuardUtil.hasProps<IYamlDatasetColumnSimple>(column, "dialects"))
    );
  }

  static isDerivedColumn(column: IYamlDatasetColumn): column is IYamlDatasetColumnDerived {
    return TypeGuardUtil.hasProps<IYamlDatasetColumnDerived>(column, "data_type", "parent_column");
  }

  static isMapColumn(column: IYamlDatasetColumn): column is IYamlDatasetColumnMap {
    return TypeGuardUtil.hasProps<IYamlDatasetColumnMap>(column, "map");
  }

  static hasColumnDataTypeProp(
    column: IYamlDatasetColumn
  ): column is IYamlDatasetColumnSimple | IYamlDatasetColumnDerived {
    return this.isSimpleColumn(column) || this.isDerivedColumn(column);
  }

  static hasDatasetSqlProp(dataset: IYamlDataset): boolean {
    return TypeGuardUtil.hasProps(dataset, "sql");
  }

  static isAlternateSql(
    input: IYamlDatasetAlternateSql | IYamlDatasetAlternateTable
  ): input is IYamlDatasetAlternateSql {
    return (
      TypeGuardUtil.hasProps(input, "sql") &&
      TypeGuardUtil.hasNoProps(input, "connection_id") &&
      TypeGuardUtil.hasNoProps(input, "table")
    );
  }

  static isAlternateTable(
    input: IYamlDatasetAlternateSql | IYamlDatasetAlternateTable
  ): input is IYamlDatasetAlternateTable {
    return (
      TypeGuardUtil.hasProps(input, "connection_id") &&
      TypeGuardUtil.hasProps(input, "table") &&
      TypeGuardUtil.hasNoProps(input, "sql")
    );
  }
}
