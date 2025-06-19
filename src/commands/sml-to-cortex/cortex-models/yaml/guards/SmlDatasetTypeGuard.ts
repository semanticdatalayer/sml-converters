import {
  SMLDataset,
  SMLDatasetAlternateSql,
  SMLDatasetAlternateTable,
  SMLDatasetColumn,
  SMLDatasetColumnDerived,
  SMLDatasetColumnMap,
  SMLDatasetColumnSimple,
} from "sml-sdk";
import TypeGuardUtil from "./type-guard-util";

export default class SmlDatasetTypeGuard {
  static isSimpleColumn(column: SMLDatasetColumn): column is SMLDatasetColumnSimple {
    return (
      TypeGuardUtil.hasProps<SMLDatasetColumnSimple>(column, "data_type") &&
      TypeGuardUtil.hasNoProps<SMLDatasetColumnDerived>(column, "parent_column")
    );
  }

  static isCalculatedColumn(column: SMLDatasetColumn): column is SMLDatasetColumnSimple {
    return (
      SmlDatasetTypeGuard.isSimpleColumn(column) &&
      (TypeGuardUtil.hasProps<SMLDatasetColumnSimple>(column, "sql") ||
        TypeGuardUtil.hasProps<SMLDatasetColumnSimple>(column, "dialects"))
    );
  }

  static isDerivedColumn(column: SMLDatasetColumn): column is SMLDatasetColumnDerived {
    return TypeGuardUtil.hasProps<SMLDatasetColumnDerived>(column, "data_type", "parent_column");
  }

  static isMapColumn(column: SMLDatasetColumn): column is SMLDatasetColumnMap {
    return TypeGuardUtil.hasProps<SMLDatasetColumnMap>(column, "map");
  }

  static hasColumnDataTypeProp(
    column: SMLDatasetColumn
  ): column is SMLDatasetColumnSimple | SMLDatasetColumnDerived {
    return this.isSimpleColumn(column) || this.isDerivedColumn(column);
  }

  static hasDatasetSqlProp(dataset: SMLDataset): boolean {
    return TypeGuardUtil.hasProps(dataset, "sql");
  }

  static isAlternateSql(
    input: SMLDatasetAlternateSql | SMLDatasetAlternateTable
  ): input is SMLDatasetAlternateSql {
    return (
      TypeGuardUtil.hasProps(input, "sql") &&
      TypeGuardUtil.hasNoProps(input, "connection_id") &&
      TypeGuardUtil.hasNoProps(input, "table")
    );
  }

  static isAlternateTable(
    input: SMLDatasetAlternateSql | SMLDatasetAlternateTable
  ): input is SMLDatasetAlternateTable {
    return (
      TypeGuardUtil.hasProps(input, "connection_id") &&
      TypeGuardUtil.hasProps(input, "table") &&
      TypeGuardUtil.hasNoProps(input, "sql")
    );
  }
}
