import {
  SMLAggregationMethod,
  SMLCalculationMethod,
  SMLColumnDataType,
  SMLDataset,
  SMLDimension,
} from "sml-sdk";
import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import {
  SnowviewEntity,
  SnowviewSynonymAndComment,
  SnowviewTable,
} from "../SnowviewModel";

const typeMap: Record<string, SMLColumnDataType> = {
  // String types
  VARCHAR: SMLColumnDataType.String,
  CHAR: SMLColumnDataType.String,
  TEXT: SMLColumnDataType.String,
  NVARCHAR: SMLColumnDataType.String,
  NCHAR: SMLColumnDataType.String,
  CLOB: SMLColumnDataType.String,
  NCLOB: SMLColumnDataType.String,

  // Integer types
  INT: SMLColumnDataType.Int,
  INTEGER: SMLColumnDataType.Int,
  SMALLINT: SMLColumnDataType.Int,
  MEDIUMINT: SMLColumnDataType.Int,

  // Large integer types
  BIGINT: SMLColumnDataType.BigInt,
  LONG: SMLColumnDataType.Long,

  // Tiny integer
  TINYINT: SMLColumnDataType.TinyInt,

  // Decimal/Numeric types
  DECIMAL: SMLColumnDataType.Decimal,
  NUMERIC: SMLColumnDataType.Numeric,
  NUMBER: SMLColumnDataType.Decimal,
  MONEY: SMLColumnDataType.Decimal,
  SMALLMONEY: SMLColumnDataType.Decimal,

  // Floating point types
  FLOAT: SMLColumnDataType.Float,
  REAL: SMLColumnDataType.Float,
  DOUBLE: SMLColumnDataType.Double,

  // Date/Time types
  TIMESTAMP: SMLColumnDataType.TimeStamp,
  DATETIME: SMLColumnDataType.DateTime,
  DATETIME2: SMLColumnDataType.DateTime,
  SMALLDATETIME: SMLColumnDataType.DateTime,
  DATE: SMLColumnDataType.Date,
  TIME: SMLColumnDataType.String, // or could be DateTime

  // Boolean types
  BOOLEAN: SMLColumnDataType.Boolean,
  BOOL: SMLColumnDataType.Boolean,
  BIT: SMLColumnDataType.Boolean,
};

const smlNumericDataTypes: SMLColumnDataType[] = [
  SMLColumnDataType.Int,
  SMLColumnDataType.Float,
  SMLColumnDataType.Decimal,
  SMLColumnDataType.Long,
  SMLColumnDataType.Double,
  SMLColumnDataType.BigInt,
  SMLColumnDataType.TinyInt,
  SMLColumnDataType.Number,
  SMLColumnDataType.Numeric,
];

const smlDateDataTypes: SMLColumnDataType[] = [
  SMLColumnDataType.Date,
  SMLColumnDataType.DateTime,
  // TODO: Should this have TimeStamp as well
  // SMLColumnDataType.TimeStamp,
];

/**
 * Checks if a given SQL data type corresponds to a numeric SML data type
 * @param dataType - The SQL data type to check
 * @param logger - Logger instance
 * @returns True if the data type maps to a numeric SML type, false otherwise
 */
export function isNumericType(dataType: string, logger: Logger): boolean {
  const sqlType = mapSqlDatatypeToSmlDataType(dataType, logger);
  return smlNumericDataTypes.includes(sqlType);
}

/**
 * Checks if a SQL data type corresponds to a date type in SML
 * @param dataType - The SQL data type to check
 * @param logger - Logger instance for error handling
 * @returns True if the data type maps to an SML date type, false otherwise
 */
export function isDateType(dataType: string, logger: Logger): boolean {
  const sqlType = mapSqlDatatypeToSmlDataType(dataType, logger);
  return smlDateDataTypes.includes(sqlType);
}

/**
 * Maps SQL data types to their corresponding SML data types.
 * @param sqlType - The SQL data type to be converted
 * @param logger - Logger instance
 * @returns The corresponding SML data type string. Defaults to "TEXT" if no match is found.
 */
export function mapSqlDatatypeToSmlDataType(
  sqlType: string,
  logger: Logger,
): SMLColumnDataType {
  const matchedType = Object.keys(typeMap).find((key) =>
    sqlType.startsWith(key),
  );
  if (!matchedType) {
    logger.warn(`Unmapped SQL data type: ${sqlType}`);
  }
  return matchedType ? typeMap[matchedType] : SMLColumnDataType.String;
}

const sqlAggToMdxAggMethod: Record<string, SMLAggregationMethod> = {
  SUM: SMLAggregationMethod.Sum,
  AVG: SMLAggregationMethod.Avg,
  MIN: SMLAggregationMethod.Min,
  MAX: SMLAggregationMethod.Max,
  COUNT: SMLAggregationMethod.Count,
};

const sqlAggToSmlCalcMethod: Record<string, SMLCalculationMethod> = {
  SUM: SMLCalculationMethod.Sum,
  AVG: SMLCalculationMethod.Average,
  MIN: SMLCalculationMethod.Minimum,
  MAX: SMLCalculationMethod.Maximum,
  COUNT: SMLCalculationMethod.NonDistinctCount,
  VAR_POP: SMLCalculationMethod.PopulationVariance,
  VARIANCE_POP: SMLCalculationMethod.PopulationVariance,
  VAR_SAMP: SMLCalculationMethod.SampleVariance,
  VARIANCE_SAMP: SMLCalculationMethod.SampleVariance,
  STDDEV: SMLCalculationMethod.SampleStandardDeviation,
  STDDEV_SAMP: SMLCalculationMethod.SampleStandardDeviation,
  STDDEV_POP: SMLCalculationMethod.PopulationStandardDeviation,
  PERCENTILE_CONT: SMLCalculationMethod.Percentile, // TODO: Handle percentile parameters
  PERCENTILE_DISC: SMLCalculationMethod.Percentile,
};  // TODO: Handle LAG functions

/**
 * Maps SQL aggregation functions to SML calculation methods
 * @param sqlAgg - SQL aggregation function name
 * @returns Corresponding SML calculation method or undefined if no match found
 */
export function mapSqlAggToSmlCalcMethod(
  sqlAgg: string,
): SMLCalculationMethod | undefined {
  const matchedAgg = Object.keys(sqlAggToSmlCalcMethod).find(
    (key) => sqlAgg.toUpperCase() === key,
  );
  if (!matchedAgg) {
    return undefined;
  }
  return matchedAgg ? sqlAggToSmlCalcMethod[matchedAgg] : undefined;
}

/**
 * Maps SQL aggregation method to MDX aggregation method
 * @param sqlAgg - SQL aggregation method string
 * @returns Corresponding SMLAggregationMethod or undefined if no match found
 */
export function mapSqlAggToMdxAggMethod(
  sqlAgg: string,
): SMLAggregationMethod | undefined {
  const matchedAgg = Object.keys(sqlAggToMdxAggMethod).find(
    (key) => sqlAgg.toUpperCase() === key,
  );
  if (!matchedAgg) {
    return undefined;
  }
  return matchedAgg ? sqlAggToMdxAggMethod[matchedAgg] : undefined;
}

/**
 * Converts a string to uppercase, removes quotes, and trims whitespace
 * @param str - The string to normalize
 * @returns The normalized string
 */
export function normalizeString(str: string): string {
  if (!str) return str;
  return str.toUpperCase().replaceAll(`"`, "").trim();
}

/**
 * Removes line breaks and tabs from a string
 * @param str - The string to process
 * @returns The processed string without line breaks and tabs
 */
export function removeLineBreaksAndTabs(str: string): string {
  if (!str) return str;
  return str.replace(/[\n\t\r]+/g, "");
}

/**
 * Retrieves the unique name of a dataset from the converter result
 * @param dataset - The dataset name to search for
 * @param result - The SML converter result containing dataset information
 * @param logger - Logger instance
 * @returns The unique name of the found dataset, or the original dataset name if not found
 */
export function getDataset(
  dataset: string,
  result: SmlConverterResult,
  logger: Logger,
): SMLDataset | undefined {
  const datasetObj = result.datasets.find(
    (d) => normalizeString(d.unique_name) === normalizeString(dataset),
  );
  if (!datasetObj) {
    logger.warn(`Dataset not found: ${dataset}`);
  }
  return datasetObj;
}

/**
 * Retrieves the exact column name from a dataset in the converter result, preserving the original case
 * @param column - The column name to search for (case-insensitive)
 * @param dataset - The dataset name to search in (case-insensitive)
 * @param result - The converter result object containing datasets and columns
 * @param logger - Logger instance
 * @returns The exact column name with original casing if found, or the input column name if not found
 */
export function getColumnName(
  column: string,
  dataset: string,
  result: SmlConverterResult,
  logger: Logger,
): string {
  const datasetObj = result.datasets.find(
    (d) => d.unique_name.toUpperCase() === dataset.toUpperCase(),
  );
  if (!datasetObj) {
    logger.warn(`Dataset not found: ${dataset}`);
    return column;
  }
  const columnObj = datasetObj.columns.find(
    (c) => c.name.toUpperCase() === column.toUpperCase(),
  );
  if (!columnObj) {
    logger.warn(`Column not found: ${column} in dataset ${dataset}`);
    return column;
  }
  return columnObj.name;
}

/**
 * Extracts SQL aggregate function and column expression from a string
 * @param expression - SQL expression string (e.g. "COUNT(column_name)")
 * @returns Object containing the aggregate function name and expression
 */
export function getSqlAggAndExpr(expression: string): {
  sqlAgg: string;
  expr: string;
} {
  expression = removeLineBreaksAndTabs(expression).trim();
  const firstParenIndex = expression.indexOf("(");
  if (firstParenIndex === -1) {
    return { sqlAgg: "", expr: expression.trim() };
  }
  const sqlAgg = expression.slice(0, firstParenIndex).trim().toUpperCase();

  let expr = expression.slice(firstParenIndex + 1);
  const lastIndex = expr.lastIndexOf(")");
  expr = lastIndex === -1 ? expr : expr.slice(0, lastIndex);
  return { sqlAgg, expr };
}

export function getTblAndColFromExpr(expr: string): {
  tbl: string | undefined;
  col: string;
  extra?: string;
} {
  const parenIndex = expr.indexOf(")");
  if (parenIndex !== -1) {
    // It's a window function, e.g. "SUM(column) OVER (PARTITION BY ...)"
    const extra = expr.slice(parenIndex).trim();
    expr = expr.slice(0, parenIndex).trim();
    if (expr.includes(".")) {
      const parts = expr.split(".").map((p) => p.trim());
      return {
        tbl: parts[0],
        col: parts[1],
        extra,
      };
    } else {
      // const col = expr.slice(0, parenIndex).trim();
      return {
        tbl: undefined,
        col: expr,
        extra,
      };
    }
  } else {
    // It's not a window function
    if (expr.includes(".")) {
      const parts = expr.split(".").map((p) => p.trim());
      return {
        tbl: parts[0],
        col: parts[1],
      };
    } else {
      return {
        tbl: undefined,
        col: expr,
      };
    }
  }
}

/**
 * Gets the used column from a sql aggregation expression
 * @param str The string expression to extract the used column from
 * @returns The extracted column name
 */
export function gettUsedColumn(
  table: string,
  sqlExpr: string,
  result: SmlConverterResult,
): string | undefined {
  // Most sql aggregation functions are in the form FUNC(column)
  // Percentiles are in the form PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY column)
  if (sqlExpr.toUpperCase().includes("WITHIN GROUP")) {
    const orderByIndex = sqlExpr.indexOf("ORDER BY");
    if (orderByIndex === -1) return undefined;
    const afterOrderBy = sqlExpr.slice(orderByIndex + "ORDER BY".length).trim();
    return getUsedColumnFromResult(table, afterOrderBy.trim(), result);

    // DISTINCT is used for the COUNT() function, so we just remove it and return the column
  } else if (sqlExpr.toUpperCase().includes("DISTINCT")) {
    const distinctRemoved = sqlExpr.replace(/DISTINCT/i, "").trim();
    return getUsedColumnFromResult(table, distinctRemoved, result);
  }
  // Sql expression could also be in the form of table.column, only return column
  return getUsedColumnFromResult(table, sqlExpr.trim(), result);
}

/**
 * Finds a column name and return its name with correct casing
 * @param table - The table name to search for
 * @param sqlExpr - SQL expression or column name to match
 * @param result - The converter result containing datasets and columns
 * @returns The matched column name or undefined if not found
 */
export function getUsedColumnFromResult(
  table: string,
  sqlExpr: string,
  result: SmlConverterResult,
): string | undefined {
  const resultTable = result.datasets.find(
    (d) => normalizeString(d.unique_name) === normalizeString(table),
  );
  if (!resultTable) {
    return undefined;
  }
  const column = resultTable.columns.find(
    (c) =>
      normalizeString(c.name) === normalizeString(sqlExpr) ||
      normalizeString(c.name) === normalizeString(sqlExpr.split(".")[1]),
  );
  return column ? column.name : undefined;
}

/**
 * Analyzes a Snowview Entity and returns information about its expression and related SML dimension
 * @param snowviewEntity - The Snowview dimension, fact, or metric to analyze
 * @param result - The SML converter result containing datasets and dimensions
 * @returns An object containing:
 *  - smlDim: The corresponding SML dimension if found
 *  - isSimpleColumnExpr: True if the expression is a simple column reference
 *  - referenceOtherTable: True if the expression references a column in another table
 */
export function getExpressionInfo(
  snowviewEntity: SnowviewEntity,
  result: SmlConverterResult,
): {
  smlDim: SMLDimension | undefined;
  isSimpleColumnExpr: boolean;
  referenceOtherTable: boolean;
  smlTbl?: SMLDataset;
} {
  const smlDim = result.dimensions.find(
    (d) => d.unique_name === `${snowviewEntity.table}_dimension`,
  );
  let smlTbl: SMLDataset | undefined;
  if (!smlDim) {
    // Check for dataset
    smlTbl = result.datasets.find(
      (ds) => ds.unique_name === snowviewEntity.table,
    );
  }
  let isSimpleColumnExpr = false;
  let referenceOtherTable = false;
  // Check if expression is just a column name in the dimension table
  const dimTable = result.datasets.find(
    (ds) => ds.label === snowviewEntity.table,
  );
  if (dimTable) {
    const col = dimTable.columns.find(
      (c) =>
        normalizeString(c.name) === normalizeString(snowviewEntity.expression),
    );
    if (col) {
      isSimpleColumnExpr = true;
      return {
        smlDim,
        isSimpleColumnExpr,
        referenceOtherTable,
        smlTbl,
      };
    }
  }

  const [tbl, col] = snowviewEntity.expression.split(".");
  if (tbl && col) {
    const otherTable = result.datasets.find(
      (ds) => normalizeString(ds.label) === normalizeString(tbl),
    );
    if (otherTable) {
      const otherCol = otherTable.columns.find(
        (c) => normalizeString(c.name) === normalizeString(col),
      );
      if (otherCol) {
        referenceOtherTable = true;
        isSimpleColumnExpr = true;
      }
    }
  }

  return { smlDim, isSimpleColumnExpr, referenceOtherTable, smlTbl };
}

export function getPrimaryUniqueKeys(
  snowviewTables: SnowviewTable[],
): string[] {
  const primaryKeys: string[] = [];
  for (const table of snowviewTables) {
    if (table.primary_key) {
      primaryKeys.push(...table.primary_key);
    }
    if (table.unique_key) {
      primaryKeys.push(...table.unique_key.flat());
    }
  }
  return primaryKeys;
}

/**
 * Creates a description string from Snowview synonyms and comments
 * @param snowviewObj - Object containing synonyms and comment data
 * @returns Formatted string with synonyms and comments, or undefined if empty
 */
export function setDescription(snowviewObj: SnowviewSynonymAndComment) {
  const result: string[] = [];
  if (snowviewObj.synonyms && snowviewObj.synonyms.length > 0) {
    result.push(`"synonyms": ${JSON.stringify(snowviewObj.synonyms)}`);
  }
  if (snowviewObj.comment) {
    result.push(`"comment": ${JSON.stringify(snowviewObj.comment)}`);
  }
  if (result.length === 0) {
    return undefined;
  }
  return `{${result.join(",")}}`;
}

/**
 * Normalizes SQL identifiers in a query string by correcting the case and formatting
 *
 * This function processes SQL identifiers (table names and column names) to ensure they match the exact case
 * and formatting defined in the schema. It handles both quoted and unquoted identifiers, and properly formats
 * identifiers containing spaces by adding quotes.
 *
 * @param sql - The SQL query string to normalize
 * @param result - The schema definition containing dataset (table) and column information
 * @returns The normalized SQL query string with corrected identifier cases and formatting
 */
export function normalizeSqlIdentifiers(
  sql: string,
  result: SmlConverterResult,
): string {
  // Build lookup maps (case-insensitive)
  const tableMap = new Map<string, string>();
  const columnMap = new Map<string, Map<string, string>>();

  result.datasets.forEach((table) => {
    tableMap.set(normalizeString(table.unique_name), table.unique_name);

    const colMap = new Map<string, string>();
    table.columns.forEach((col) => {
      if ("sql" in col && col.sql) {
        // Handle SQL expressions: store both raw expression and normalized version
        colMap.set(normalizeString(col.name), col.sql);
      } else {
        colMap.set(normalizeString(col.name), col.name);
      }
    });
    columnMap.set(normalizeString(table.unique_name), colMap);
  });

  // Regex to match SQL identifiers (quoted or unquoted)
  // Matches: word characters, quoted strings with spaces, or dot notation
  const identifierRegex = /"([^"]+)"|([a-zA-Z_][a-zA-Z0-9_]*)/g;

  let results = sql;
  const replacements: Array<{
    start: number;
    end: number;
    replacement: string;
  }> = [];

  // Track context to determine if we're dealing with a table or column
  let match;
  const tokens: Array<{
    value: string;
    start: number;
    end: number;
    isQuoted: boolean;
  }> = [];

  while ((match = identifierRegex.exec(sql)) !== null) {
    const isQuoted = match[1] !== undefined;
    const value = isQuoted ? match[1] : match[2];
    tokens.push({
      value,
      start: match.index,
      end: match.index + match[0].length,
      isQuoted,
    });
  }

  // Process tokens to handle table.column patterns
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];
    const tokenAfterNext = tokens[i + 2];

    // Check if this is a table.column pattern
    if (
      nextToken &&
      tokenAfterNext &&
      sql.substring(token.end, nextToken.start).trim() === "." &&
      sql.substring(nextToken.end, tokenAfterNext.start).trim() === "."
    ) {
      // Pattern: table.column
      const tableName = normalizeString(token.value);
      const columnName = normalizeString(tokenAfterNext.value);

      if (tableMap.has(tableName)) {
        const correctTable = tableMap.get(tableName)!;
        const colMap = columnMap.get(tableName);

        if (colMap && colMap.has(columnName)) {
          const correctColumn = colMap.get(columnName)!;

          // Format with quotes if needed
          const formattedTable = correctTable.includes(" ")
            ? `"${correctTable}"`
            : correctTable;
          const formattedColumn = correctColumn.includes(" ")
            ? `"${correctColumn}"`
            : correctColumn;

          replacements.push({
            start: token.start,
            end: tokenAfterNext.end,
            replacement: `${formattedTable}.${formattedColumn}`,
          });

          i += 2; // Skip the dot and column tokens
          continue;
        }
      }
    }

    // Try to match as a standalone table or column
    const lowerValue = normalizeString(token.value);

    // Check if it's a table name
    if (tableMap.has(lowerValue)) {
      const correctName = tableMap.get(lowerValue)!;
      const formatted = correctName.includes(" ")
        ? `"${correctName}"`
        : correctName;
      replacements.push({
        start: token.start,
        end: token.end,
        replacement: formatted,
      });
    } else {
      // Check if it's a column name in any table
      for (const [tableName, colMap] of columnMap.entries()) {
        if (colMap.has(lowerValue)) {
          const correctName = colMap.get(lowerValue)!;
          const formatted = correctName.includes(" ")
            ? `"${correctName}"`
            : correctName;
          replacements.push({
            start: token.start,
            end: token.end,
            replacement: formatted,
          });
          break;
        }
      }
    }
  }

  // Apply replacements in reverse order to maintain correct indices
  replacements.sort((a, b) => b.start - a.start);

  for (const { start, end, replacement } of replacements) {
    results =
      results.substring(0, start) + replacement + results.substring(end);
  }

  return results;
}
