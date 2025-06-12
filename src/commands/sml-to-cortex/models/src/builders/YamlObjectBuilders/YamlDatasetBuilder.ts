import {
  SMLObjectType,
  SMLDataset,
  SMLDatasetAlternateSql,
  SMLDatasetAlternateTable,
  SMLDatasetColumn,
  SMLDatasetColumnDerived,
  SMLDatasetColumnMap,
  SMLDatasetColumnMapDefinition,
  SMLDatasetColumnSimple,
  SMLDatasetIncremental,
  SMLColumnDataType
} from "sml-sdk";

// import { ObjectType } from "../../ObjectType";
// import {
//   IYamlDataset,
//   IYamlDatasetAlternateSql,
//   IYamlDatasetAlternateTable,
//   IYamlDatasetColumn,
//   IYamlDatasetColumnDerived,
//   IYamlDatasetColumnMap,
//   IYamlDatasetColumnMapDefinition,
//   IYamlDatasetColumnSimple,
//   IYamlDatasetIncremental,
//   YamlColumnDataType,
// } from "../../yaml/IYamlDataset";
import { YamlObjectBuilder } from "./YamlObjectBuilder";

type SqlSource = Required<Pick<SMLDataset, "sql">>;
type TableSource = Required<Pick<SMLDataset, "table">>;

const isSqlSource = (input: SqlSource | TableSource): input is SqlSource => {
  return Object.getOwnPropertyNames(input).includes("sql");
};

const isTableSource = (input: SqlSource | TableSource): input is TableSource => {
  return Object.getOwnPropertyNames(input).includes("table");
};

export default class YamlDatasetBuilder extends YamlObjectBuilder<SMLDataset, YamlDatasetBuilder> {
  static create(dataset?: SMLDataset): YamlDatasetBuilder {
    const sampleColumn: SMLDatasetColumnSimple = {
      name: "name",
      data_type: SMLColumnDataType.String,
    };
    const defaultData: SMLDataset = {
      object_type: SMLObjectType.Dataset,
      unique_name: "dataset unique name",
      label: "dataset label",
      columns: [sampleColumn],
      connection_id: "unique connid",
    };

    return new YamlDatasetBuilder(dataset || defaultData);
  }

  static empty(): YamlDatasetBuilder {
    return new YamlDatasetBuilder({ object_type: SMLObjectType.Dataset } as SMLDataset);
  }

  setSource(input: SqlSource | TableSource): YamlDatasetBuilder {
    let realInput: Partial<SMLDataset> = {};

    if (isSqlSource(input)) {
      realInput = { ...input, table: undefined };
    } else if (isTableSource(input)) {
      realInput = { ...input, sql: undefined };
    } else {
      throw new Error(
        `YamlDatasetBuilder.setSource is called with object which is neither SqlSource not TableSource. Object type: ${typeof input}`
      );
    }

    return this.with(realInput);
  }

  private addColumnInternal(column: SMLDatasetColumn) {
    return this.with({ columns: [...this.clonedData.columns, column] });
  }

  addColumn(name: string, data_type = SMLColumnDataType.Int): YamlDatasetBuilder {
    const simpleColumn: SMLDatasetColumnSimple = {
      name,
      data_type,
    };

    return this.addColumnInternal(simpleColumn);
  }

  addIncremental(incremental?: Partial<SMLDatasetIncremental>): YamlDatasetBuilder {
    const defaultIncremental: SMLDatasetIncremental = {
      column: "column",
      grace_period: "10s",
    };

    const newIncremental = Object.assign(defaultIncremental, incremental);
    return this.with({ incremental: { ...(this.clonedData.incremental || newIncremental) } });
  }

  addCalculatedColumn(
    name: string,
    data_type = SMLColumnDataType.Int,
    dialects: Array<{ dialect: string; sql: string }>
  ) {
    const simpleColumn: SMLDatasetColumnSimple = {
      name,
      data_type,
      dialects,
    };

    return this.addColumnInternal(simpleColumn);
  }

  addColumnMapped(name: string, map: SMLDatasetColumnMapDefinition) {
    const mappedCol: SMLDatasetColumnMap = {
      name,
      map,
    };
    return this.addColumnInternal(mappedCol);
  }

  addColumnWithParent(name: string, parent_column: string, data_type = SMLColumnDataType.String) {
    const derivedColumn: SMLDatasetColumnDerived = {
      name,
      parent_column,
      data_type,
    };
    return this.addColumnInternal(derivedColumn);
  }

  addAlternateSql(alternate: Partial<SMLDatasetAlternateSql> = {}): YamlDatasetBuilder {
    const defaultAlternateSql: SMLDatasetAlternateSql = {
      type: "type1",
      sql: "sql1",
    };

    const newAlternateSql = Object.assign(defaultAlternateSql, alternate);
    return this.with({ alternate: { ...(this.clonedData.alternate || newAlternateSql) } });
  }

  addAlternateTable(alternate: Partial<SMLDatasetAlternateTable> = {}): YamlDatasetBuilder {
    const defaultAlternateTable: SMLDatasetAlternateSql | SMLDatasetAlternateTable = {
      type: "type1",
      connection_id: "con_id",
      table: "table",
    };

    const newAlternateTable = Object.assign(defaultAlternateTable, alternate);
    return this.with({ alternate: { ...(this.clonedData.alternate || newAlternateTable) } });
  }

  withConnection(connection_unique_name: string): YamlDatasetBuilder {
    return this.with({ connection_id: connection_unique_name });
  }
}
