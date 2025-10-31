import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { SnowflakeCon } from "../snowflake-connect";
import {
  SnowviewModel,
  SnowviewTable,
  TableDescribe,
  TableLists,
} from "../SnowviewModel";

import {
  SMLConnection,
  SMLDataset,
  SMLDatasetColumn,
  SMLObjectType,
} from "sml-sdk";
import { mapSqlDatatypeToSmlDataType } from "./converter-util";

export class SnowviewTableConverter {
  constructor(
    private readonly logger: Logger,
    private readonly snowflakeCon: SnowflakeCon,
  ) {}

  async mapTablesToSmlDatasets(
    snowviewTables: Array<SnowviewTable>,
    connections: SMLConnection[],
  ) {
    const datasets = await Promise.all(
      snowviewTables.map((table) =>
        this.mapTableToSmlDataset(table, connections),
      ),
    );

    return datasets;
  }

  /**
   * Maps a Snowview table to an SML dataset
   * @param snowviewTable - The Snowview table to be converted
   * @param asConnection - The connection ID to be used for the dataset
   */
  async mapTableToSmlDataset(
    snowviewTable: SnowviewTable,
    connections: SMLConnection[],
  ) {
    const tableDescribe = await this.snowflakeCon.getTableFromSnowflake(
      snowviewTable,
    );

    const connection = connections.find(
      (connection) =>
        connection.database === snowviewTable.database &&
        connection.schema === snowviewTable.schema,
    );

    if (!connection) {
      throw new Error(
        `Error generating ${snowviewTable.name} dataset, missing connection file for ${snowviewTable.database}.${snowviewTable.schema} schema.`,
      );
    }

    const dataset: SMLDataset = {
      object_type: SMLObjectType.Dataset,
      unique_name: snowviewTable.name,
      description: snowviewTable.comment,
      label: snowviewTable.name,
      columns: this.mapColumns(tableDescribe),
      connection_id: connection.unique_name,
      table: snowviewTable.table.replaceAll(`"`, ""), // Quotes will be added in the SQL generation
    };

    return dataset;
  }

  /**
   * Maps Snowflake table columns to SML dataset columns.
   * @param tableDescribe - The table description containing column information from Snowflake
   * @returns An array of SML dataset columns with mapped data types
   */
  mapColumns(tableDescribe: TableDescribe): SMLDatasetColumn[] {
    const columns: SMLDatasetColumn[] = [];
    for (const col of tableDescribe.columns) {
      if (col.kind === "COLUMN") {
        columns.push({
          name: col.name,
          data_type: mapSqlDatatypeToSmlDataType(col.type, this.logger),
        });
      } else {
        this.logger.warn(
          `Unknown column kind: ${col.kind} for column ${col.name}`,
        );
      }
    }
    return columns;
  }

  /**
   * Identifies and categorizes tables as either fact or dimension tables within the Snowview model.
   * Tables that are referenced as 'ref_table' in relationships are classified as dimension tables,
   * while all remaining tables are classified as fact tables.
   *
   * @param snowviewModel - The Snowview data model containing tables and relationships
   * @param tableLists - Object containing Sets for storing fact and dimension tables
   */
  identifyFactAndDimTables(snowviewModel: SnowviewModel) {
    const tableLists: TableLists = {
      factTables: new Set<SnowviewTable>(),
      dimTables: new Set<SnowviewTable>(),
    };

    for (const relationship of snowviewModel.relationships) {
      // Anything that's a ref_table in the realtionships is a dimension table
      const dimTable = snowviewModel.tables.find(
        (t) => t.name === relationship.ref_table,
      );
      if (dimTable) {
        tableLists.dimTables.add(dimTable);
      }
    }
    for (const table of snowviewModel.tables) {
      if (!tableLists.dimTables.has(table)) {
        // Anything not a dimension table is a fact table
        tableLists.factTables.add(table);
      }
    }

    return tableLists;
  }
}
