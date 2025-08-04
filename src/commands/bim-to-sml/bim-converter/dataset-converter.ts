import {
  SMLColumnDataType,
  SMLDataset,
  SMLDatasetColumnSimple,
  SMLObjectType,
} from "sml-sdk";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import {
  BimColumnDataType,
  BimColumnType,
  BimPartitionSourceType,
  BimRoot,
  BimTable,
  BimTableColumn,
  BimTablePartition,
} from "../bim-models/bim-model";
import { isMathOrWhite } from "./expression-parser";
import { removeComments } from "./tools";
import { MeasureConverter } from "./measure-converter";
import { ReturnedMDX, queryFromExpression } from "./bim-tools";
import { makeUniqueName } from "./tools";
import {
  arrayToStringAlphabetical,
  descriptionAsString,
  expressionAsString,
  exprToComment,
  lowerNoSpace,
  setToStringAlphabetical,
} from "./tools";
import {
  TableLists,
  AttributeMaps,
  MessagesMap,
  Returnable,
} from "../bim-models/types-and-interfaces";
import { Constants } from "../bim-models/constants";
import { Logger } from "../../../shared/logger";

export class DatasetConverter {
  private logger: Logger;
  private measureConverter: MeasureConverter;
  constructor(logger: Logger) {
    this.logger = logger;
    this.measureConverter = new MeasureConverter(logger);
  }

  async createDatasetsAndMetrics(
    bim: BimRoot,
    result: SmlConverterResult,
    tableLists: TableLists,
    attrMaps: AttributeMaps,
  ) {
    const promises: Promise<void>[] = [];
    const messagesMap: MessagesMap = {
      customMsgs: new Set<string>(),
      complexMsgs: new Set<string>(),
      unknownMsgs: new Set<string>(),
      rawCalcs: new Set<string>(),
    };
    for (const tbl of bim.model.tables) {
      // if (!unusedTables.has(bim.model.tables[i].name)) {
      this.checkForMultiLayerComments(tbl);

      promises.push(
        this.convertToDatasetAndMetrics(
          tbl,
          bim,
          result,
          messagesMap,
          tableLists,
          attrMaps,
        ),
      );
    }

    await Promise.all(promises);
    // Use this block instead of simple await for debugging
    // try {
    //   const results = await Promise.all(promises);
    // } catch (error) {
    //   console.error("Error in Promise.all:", error);
    // }
    if (messagesMap.customMsgs.size > 0)
      this.logger.info(
        `The following dataset(s) are defined using a custom calculation. They will be treated as tables that need to be materialized: ${setToStringAlphabetical(
          messagesMap.customMsgs,
          ", ",
        )}`,
      );
    if (messagesMap.complexMsgs.size > 0)
      this.logger.info(
        `The following dataset(s) are defined with a complex source. They will be treated as tables that need to be materialized: ${setToStringAlphabetical(
          messagesMap.complexMsgs,
          ", ",
        )}`,
      );
    if (messagesMap.unknownMsgs.size > 0)
      this.logger.info(
        `The following dataset(s) have an unknown definition type. They will be treated as tables that need to be materialized: ${setToStringAlphabetical(
          messagesMap.unknownMsgs,
          ", ",
        )}`,
      );
  }

  // Creates the dataset and adds to SML. For bim measures creates as SML metricCalcs when the logic
  // is simple such as using math logic on other measures or divide measures
  async convertToDatasetAndMetrics(
    bimTable: BimTable,
    bim: BimRoot,
    result: SmlConverterResult,
    messagesMap: MessagesMap,
    tableLists: TableLists,
    attrMaps: AttributeMaps,
  ): Promise<void> {
    const model = result.models[0];
    const dataset_unique_name = makeUniqueName(`dataset.${bimTable.name}`);
    messagesMap.rawCalcs = new Set<string>();

    if (!tableLists.unusedTables.has(bimTable.name)) {
      const dataset = this.convertDataset(
        dataset_unique_name,
        bimTable,
        bim,
        messagesMap.customMsgs,
        messagesMap.complexMsgs,
        messagesMap.unknownMsgs,
      );
      result.datasets.push(dataset);
    }

    if (bimTable.measures != undefined) {
      // Now handle the Calculated Measures
      const promises: Promise<void>[] = [];
      for (const element of bimTable.measures) {
        const bimMeasure = element;
        if (
          !attrMaps.metricLookup.has(
            "calc" + lowerNoSpace(bimTable.name + "[" + bimMeasure.name + "]"),
          )
        ) {
          // Creates metricCalc when expression is math only logic
          const smlMetric = this.measureConverter.metricFromCalc(
            bim,
            bimMeasure,
            bimTable,
            result,
            attrMaps,
            messagesMap.rawCalcs,
            tableLists,
          );

          if (smlMetric) {
            this.measureConverter.addSMLCalc(smlMetric, model, result, attrMaps, bimTable);
          }
        }
      }
      await Promise.all(promises);
    }
    if (messagesMap.rawCalcs.size > 0)
      this.logger.info(
        `The following measures defined in original table '${
          bimTable.name
        }' are being created as SML calculations with an initial value of 0. The original expressions are commented out. The definitions need to be updated to use valid MDX expressions: ${
          messagesMap.rawCalcs.size < 4
            ? setToStringAlphabetical(messagesMap.rawCalcs, ", ")
            : setToStringAlphabetical(messagesMap.rawCalcs, ", ", 3)
        }`,
      );
  }

  convertDataset(
    datasetUniqueName: string,
    bimTable: BimTable,
    bim: BimRoot,
    customMsgs: Set<string>,
    complexMsgs: Set<string>,
    unknownMsgs: Set<string>,
  ): SMLDataset {
    let connection_unique_name = makeUniqueName(`connection.${bim.name}`);
    if (bimTable.partitions && bimTable.partitions[0].source.dataSource) {
      connection_unique_name = bimTable.partitions[0].source.dataSource;
    }

    const calculated_cols = new Set<string>();
    const msgObj: ReturnedMDX = { str1: datasetUniqueName, str2: "" };

    let sql = this.sqlFromPartitions(
      bimTable,
      msgObj,
      customMsgs,
      complexMsgs,
      unknownMsgs,
    );

    if (!sql && bimTable.refreshPolicy?.sourceExpression) {
      sql = queryFromExpression(
        bimTable.refreshPolicy.sourceExpression,
        msgObj,
        complexMsgs,
        unknownMsgs,
      );
    }
    if (!sql && !this.tableFromPartitions(bimTable) && msgObj.str2) {
      this.logger.info(msgObj.str2);
      msgObj.str2 = "";
    }

    const dataset = {
      object_type: SMLObjectType.Dataset,
      unique_name: datasetUniqueName,
      description: descriptionAsString(bimTable.description),
      label: bimTable.name,
      columns: bimTable.columns.map((c) =>
        c.type != undefined &&
        c.type.localeCompare(BimColumnType.Calculated) == 0
          ? this.mapYamlCalculatedColumn(c, bimTable, calculated_cols)
          : this.mapYamlColumn(c),
      ),
      connection_id: connection_unique_name,
      sql: sql,
      table: bimTable.name,
    } satisfies SMLDataset;
    // Create a calculated column to support "countrows" aggregation
    dataset.columns.push(this.createCountRowsCol());

    if (calculated_cols.size > 0)
      this.logger.info(
        `Dataset '${
          dataset.unique_name
        }' contains the following calculated columns, currently set to null with original expression commented out. They need to be updated to run against the sql engine: ${setToStringAlphabetical(
          calculated_cols,
          ", ",
        )}`,
      );

    return dataset;
  }

  sqlFromPartitions(
    bimTable: BimTable,
    msgObj: ReturnedMDX,
    customMsgs: Set<string>,
    complexMsgs: Set<string>,
    unknownMsgs: Set<string>,
  ): string | undefined {
    let sql: string | undefined = undefined;
    if (bimTable.partitions?.length > 0) {
      // SQL definition is built using a UNION ALL between the definitions of each partition
      sql = this.extractSql(
        bimTable.partitions[0],
        msgObj,
        customMsgs,
        complexMsgs,
        unknownMsgs,
      );

      if (bimTable.partitions.length > 1 && sql.length > 0) {
        for (let i = 1; i < bimTable.partitions.length; i++) {
          const sql2 = this.extractSql(
            bimTable.partitions[i],
            msgObj,
            customMsgs,
            complexMsgs,
            unknownMsgs,
          );
          if (sql2) sql += ` UNION ALL ${sql2}`;
          if (msgObj.str2) {
            this.logger.info(msgObj.str2);
            msgObj.str2 = "";
          }
        }
      }
    }
    return sql;
  }

  extractSql(
    partition: BimTablePartition,
    passObject: ReturnedMDX,
    customMsgs: Set<string>,
    complexMsgs: Set<string>,
    unknownMsgs: Set<string>,
  ): string {
    if (partition.source) {
      if (
        partition.source.type &&
        partition.source.type === BimPartitionSourceType.Calculated
      ) {
        customMsgs.add(passObject.str1);
        return "";
      } else if (partition.source.query) {
        const queryStr = expressionAsString(partition.source.query);
        if (queryStr.toLowerCase().startsWith("select ")) {
          // See in POC, PTM, PFM, magalu
          return queryStr;
        } else {
          unknownMsgs.add(passObject.str1);
          return "";
        }
      } else if (partition.source.expression) {
        return queryFromExpression(
          partition.source.expression,
          passObject,
          complexMsgs,
          unknownMsgs,
        );
      } else if (partition.source.expressionSource !== "table") {
        // Hit this in TPCDS
        unknownMsgs.add(passObject.str1);
        return "";
      }
    } else {
      // Don't hit this in test files
      passObject.str2 = `Dataset '${passObject.str1}' does not contain a source definition. It will be treated as a table that needs to be materialized`;
      return "";
    }
    return "";
  }

  mapYamlColumn(bimColumn: BimTableColumn): SMLDatasetColumnSimple {
    return {
      name: bimColumn.name,
      data_type: this.mapBimToSMLColDataType(bimColumn.name, bimColumn.dataType),
    };
  }

  mapYamlCalculatedColumn(
    bimColumn: BimTableColumn,
    bimTable: BimTable,
    calculatedCols: Set<string>,
  ): SMLDatasetColumnSimple {
    const returnVal: SMLDatasetColumnSimple = {
      name: bimColumn.name,
      data_type: this.mapBimToSMLColDataType(bimColumn.name, bimColumn.dataType),
      sql:
        bimColumn.expression != undefined
          ? this.newColExpr(bimColumn, bimTable, calculatedCols)
          : bimColumn.name, // replaceQuotes(bimColumn.expression)
    };
    return returnVal;
  }

  mapBimToSMLColDataType(
    colName: string,
    bimColumnType: BimColumnDataType,
  ): SMLColumnDataType {
    switch (bimColumnType.toLowerCase()) {
      case BimColumnDataType.String.toLowerCase():
        return SMLColumnDataType.String;
      case BimColumnDataType.Int64.toLowerCase():
        return SMLColumnDataType.Long;
      case BimColumnDataType.Double.toLowerCase():
        return SMLColumnDataType.Double;
      case BimColumnDataType.Decimal.toLowerCase():
        return SMLColumnDataType.Decimal;
      case BimColumnDataType.Boolean.toLowerCase():
        return SMLColumnDataType.Boolean;
      case BimColumnDataType.DateTime.toLowerCase():
        return SMLColumnDataType.DateTime;
      case BimColumnDataType.Binary.toLowerCase():
        return SMLColumnDataType.String;
      case BimColumnDataType.Variant.toLowerCase():
        return SMLColumnDataType.String;
    }
    this.logger.warn(
      `Bim column ${colName} has a data type of ${bimColumnType} which is not supported. The original type could be 'inferred' and the intention could be to create a calculation. The data type will be treated as a string in the SML`,
    );
    return SMLColumnDataType.String;
  }

  // For calculated columns
  newColExpr(
    bimColumn: BimTableColumn,
    bimTable: BimTable,
    calculatedCols: Set<string>,
  ): string | undefined {
    const passable = this.initializeReturnable();

    if (bimColumn.expression) {
      const e = removeComments(expressionAsString(bimColumn.expression));
      for (passable.i = 0; passable.i < e.length; passable.i++) {
        if (isMathOrWhite(e[passable.i])) {
          passable.expr += e[passable.i];
          continue;
        }
        switch (e[passable.i]) {
          case "[":
            this.processOpenSquareBrace(
              e,
              true,
              bimTable,
              calculatedCols,
              bimColumn,
              passable,
            );
            if (passable.doReturn) return passable.expr;
            break;
          case "'":
            this.processTable(e, calculatedCols, bimColumn, passable, bimTable);
            if (passable.doReturn) return passable.expr;
            break;
          default:
            if (passable.doReturn) {
              return passable.expr;
            } else {
              return exprToComment(bimColumn.expression);
            }
        }
      }
      return passable.expr ?? exprToComment(bimColumn.expression);
    }
    if (bimColumn.expression) {
      calculatedCols.add(bimColumn.name);
      return exprToComment(removeComments(bimColumn.expression));
    }
    return undefined;
  }

  checkForMultiLayerComments(tbl: BimTable) {
    const msgMeas = new Array<string>();
    if (tbl.measures) {
      for (const meas of tbl.measures) {
        const e = removeComments(expressionAsString(meas.expression));
        if (e.includes("/*") || e.includes("*/")) {
          meas.expression = "0";
          msgMeas.push(meas.name);
        }
      }
    }
    if (msgMeas.length > 0) {
      this.logger.warn(
        `BIM table '${
          tbl.name
        }' has measures that include comments within comments, or unmatched comment notation, making the expression(s) invalid. They will be set to '0' and should be updated manually: ${arrayToStringAlphabetical(
          msgMeas,
          ",",
        )}`,
      );
    }
  }

  createCountRowsCol(): SMLDatasetColumnSimple {
    return {
      name: Constants.ROW_COUNT_COLUMN_NAME,
      data_type: "int",
      sql: "1",
    } satisfies SMLDatasetColumnSimple;
  }

  tableFromPartitions(bimTable: BimTable): boolean {
    if (
      bimTable.partitions?.length > 0 &&
      bimTable.partitions[0].source.expressionSource == "table"
    ) {
      return true;
    }
    return false;
  }

  initializeReturnable(): Returnable {
    return {
      expr: "",
      i: 0,
      doReturn: false,
    };
  }

  processOpenSquareBrace(
    expr: string,
    isFirst: boolean,
    bimTable: BimTable,
    calculatedCols: Set<string>,
    bimColumn: BimTableColumn,
    passable: Returnable,
  ) {
    const end = expr.substring(passable.i).indexOf("]");
    if (end > 0) {
      const subCol = isFirst
        ? expr.substring(passable.i, end)
        : expr.substring(passable.i + 1, passable.i + end);
      if (bimTable.columns.find((c) => c.name === subCol && !c.expression)) {
        passable.expr += subCol;
        passable.i += subCol.length + 1;
      } else {
        return this.addColAndReturn(calculatedCols, bimColumn, passable);
      }
    } else {
      return this.addColAndReturn(calculatedCols, bimColumn, passable);
    }
  }

  processTable(
    e: string,
    calculatedCols: Set<string>,
    bimColumn: BimTableColumn,
    passable: Returnable,
    bimTable: BimTable,
  ) {
    const endTbl = e.substring(passable.i + 1).indexOf("'") + 1;
    if (endTbl > 1) {
      // Found potential table name between single quotes
      const subTbl = e.substring(passable.i + 1, passable.i + endTbl);
      if (bimTable.name === subTbl) {
        if (endTbl > 0) {
          // Found table like 'tablename'
          passable.i += endTbl + 1;
          if (e[passable.i] === "[") {
            this.processOpenSquareBrace(
              e,
              false,
              bimTable,
              calculatedCols,
              bimColumn,
              passable,
            );
          }
        }
      }
    }
  }

  addColAndReturn(
    calculatedCols: Set<string>,
    bimColumn: BimTableColumn,
    passable: Returnable,
  ) {
    calculatedCols.add(bimColumn.name);
    passable.doReturn = true;
    passable.expr = exprToComment(bimColumn.expression) ?? "";
  }
}
