import {
  SMLDimension,
  SMLDimensionalAttribute,
  SMLDimensionLevelAttribute,
  SMLDimensionRelationship,
  SMLDimensionType,
  SMLMetric,
  SMLModel,
} from "sml-sdk";
import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import {
  BimMeasure,
  BimModel,
  BimRoot,
  BimTable,
  BimTableColumn,
} from "../bim-models/bim-model";
import {
  aggFunctionAtStart,
  isSimpleFunctionWithCol,
} from "./expression-parser";
import {
  expressionAsString,
  lookupAttrUniqueName,
  lowerNoSpace,
  makeUniqueName,
  replaceAll,
} from "./tools";

export function listRelationshipColumns(
  bimModel: BimModel,
  bimTable: BimTable,
): Array<string> {
  const columnsInOrder = new Array<string>();
  const relationshipColumns = new Set<string>();

  // First list the columns needed for relationships
  if (bimModel.relationships != undefined) {
    bimModel.relationships.forEach((relationship) => {
      if (relationship.toTable.localeCompare(bimTable.name) == 0) {
        relationshipColumns.add(relationship.toColumn);
      }
    });
  }
  if (relationshipColumns.size > 0) {
    // Order the columns by when listed in bim table columns, desc
    for (let i = bimTable.columns.length; i--; i >= 0) {
      if (relationshipColumns.has(bimTable.columns[i].name)) {
        columnsInOrder.push(bimTable.columns[i].name);
      }
    }
  }
  return columnsInOrder;
}

export function colsUsedByTbl(
  bim: BimRoot,
  result: SmlConverterResult,
  bimTblName: string,
): Set<string> {
  const usedCols = new Set<string>();
  const datasetName = makeUniqueName(`dataset.${bimTblName}`);

  result.measures.forEach((meas: SMLMetric) => {
    if (meas.dataset === datasetName) {
      usedCols.add(meas.column);
    }
  });
  result.dimensions?.forEach((dim: SMLDimension) => {
    dim.level_attributes.forEach((attr) => {
      gatherAttrCols(attr).forEach((col) => usedCols.add(col));
    });
    dim.relationships?.forEach((rel: SMLDimensionRelationship) => {
      if (rel.from.dataset === datasetName)
        rel.from.join_columns.forEach((col) => usedCols.add(col));
    });
    dimLevels(dim).forEach((level) => {
      level.secondary_attributes?.forEach((sec) => {
        if (sec.dataset === datasetName) {
          gatherAttrCols(sec).forEach((col) => usedCols.add(col));
        }
      });
    });
  });
  const model: SMLModel = result.models[0];
  if (model) {
    model.relationships?.forEach((rel) => {
      if (rel.from.dataset === datasetName)
        rel.from.join_columns.forEach((col) => usedCols.add(col));
    });
  }
  return usedCols;
}

export function gatherAttrCols(attr: SMLDimensionalAttribute): Set<string> {
  const usedCols = new Set<string>();
  if ("name_column" in attr) usedCols.add(attr.name_column);
  if ("key_columns" in attr)
    attr.key_columns?.forEach((keyCol) => usedCols.add(keyCol));
  if ("sort_column" in attr && attr.sort_column) usedCols.add(attr.sort_column);
  return usedCols;
}

export function doCreateSummary(
  colName: string,
  summarizeBy: string | undefined,
): boolean {
  if (!summarizeBy || summarizeBy.toLocaleLowerCase() === "none") return false;

  const suffixes = ["_sk", "_id", "year", "hour", "month"];
  suffixes.forEach((suffix) => {
    if (colName.toLocaleLowerCase().endsWith(suffix)) return false;
  });

  const nonSumCols = ["column", "recordno", "modifiedby", "createdby"];
  if (nonSumCols.includes(colName.toLowerCase())) return false;

  return true;
}

export function getKeyColumn(bimTable: BimTable): string | undefined {
  const keyCol = bimTable.columns.find((c) => c.isKey);
  if (keyCol) return keyCol.name;
  return undefined;
}

export function dimFromDataset(
  result: SmlConverterResult,
  dsName: string,
): SMLDimension | undefined {
  let dimToReturn;
  result.dimensions?.forEach((dim) => {
    dim.level_attributes.forEach((la) => {
      if ("dataset" in la && la.dataset === dsName) dimToReturn = dim;
    });
  });
  return dimToReturn;
}

/**
 * Extracts all levels from each hierarchy in a dimension into a single array.
 */
export function dimLevels(dim: SMLDimension) {
  const levels = dim.hierarchies.flatMap((hier) => hier.levels);
  return levels;
}

/**
 * Retrieves a set of dataset names associated with a specific dimension from the SmlConverterResult.
 *
 * Iterates through the dimensions in the provided result, matching the given dimension name.
 * Collects dataset names from both level attributes and secondary attributes within hierarchies.
 *
 * @param result - The SmlConverterResult object containing dimensions to search.
 * @param dimName - The unique name of the dimension to filter by.
 * @returns A Set of dataset names (strings) found within the specified dimension.
 */
export function datasetsInDim(
  result: SmlConverterResult,
  dimName: string,
): Set<string> {
  const datasets = new Set<string>();
  result.dimensions
    .filter((dim: SMLDimension) => dim.unique_name === dimName)
    .forEach((dim) => {
      dim.level_attributes.forEach((la: SMLDimensionLevelAttribute) => {
        if ("dataset" in la) datasets.add(la.dataset);
      });
      dim.hierarchies.forEach((heir) => {
        heir.levels.forEach((level) => {
          level.secondary_attributes?.forEach((secondary) => {
            datasets.add(secondary.dataset);
          });
        });
      });
    });
  return datasets;
}

/**
 * Returns a unique name for a created measure, if it matches a simple aggregate pattern.
 * Looks up the measure in the BIM model and uses the attribute name map for uniqueness.
 *
 * @param measName - Name of the measure
 * @param bim - BIM root object
 * @param attrNameMap - Attribute name map
 * @returns Unique name or empty string
 */
export function uniqueNameForCreatedMeas(
  measName: string,
  bim: BimRoot,
  attrNameMap: Map<string, string[]>,
  logger: Logger,
): string | undefined {
  const meas = findMeasure(measName, bim);
  if (meas?.expression) {
    const exprLowerNoSpace = lowerNoSpace(expressionAsString(meas.expression));
    const aggFn = aggFunctionAtStart(exprLowerNoSpace);
    if (aggFn !== "none" && isSimpleFunctionWithCol(exprLowerNoSpace)) {
      const tbl = bim.model.tables.find((t) =>
        exprLowerNoSpace.includes("(" + lowerNoSpace(t.name) + "["),
      );
      if (tbl) {
        return lookupAttrUniqueName(
          attrNameMap,
          makeUniqueName(`metric.${tbl.name}.`) +
            meas.name +
            makeUniqueName(`.${aggFn}`) +
            "",
          true,
          logger,
        );
      }
    }
  }
  return "";
}

export function checkForTimeDim(result: SmlConverterResult, logger: Logger) {
  const foundTime = result.dimensions.find(
    (dim) => dim.type && dim.type === SMLDimensionType.Time,
  );
  if (!foundTime)
    logger.info(
      `No time dimension found in resulting SML so one should be identified and created/updated in Design Center`,
    );
}

export function findAttrUse(
  bimAttrName: string,
  result: SmlConverterResult,
  dimensionName?: string,
): string {
  for (const d of result.dimensions) {
    // If dimensionName is provided, only search in that dimension
    if (dimensionName && d.unique_name !== dimensionName) {
      continue;
    }
    for (const l of d.level_attributes) {
      if (l.unique_name === bimAttrName) return "level";
    }
    for (const h of d.hierarchies) {
      for (const l of h.levels) {
        if (l.secondary_attributes)
          for (const a of l.secondary_attributes) {
            if (a.unique_name === bimAttrName) return "attr";
          }
      }
    }
  }
  return "none";
}

export function findMeasure(
  bimMeasName: string,
  bim: BimRoot,
): BimMeasure | undefined {
  for (const tbl of bim.model.tables) {
    if (tbl.measures)
      for (const meas of tbl.measures) {
        if (meas.name === bimMeasName) {
          return meas;
        }
      }
  }
  return undefined;
}

export function findColumn(
  bimTblName: string,
  bimColName: string,
  bim: BimRoot,
): BimTableColumn | undefined {
  for (const tbl of bim.model.tables) {
    if (tbl.name === bimTblName && tbl.columns)
      for (const col of tbl.columns) {
        if (col.name === bimColName) return col;
      }
  }
  return undefined;
}

export function addRenamedColumns(expression: string, sql: string): string {
  if (!sql) return sql;
  const columnMapping: Map<string, string> | undefined =
    extractColumnMapping(expression);
  if (columnMapping) {
    // Add outer query to map the column names
    let prefix = "select *, ";
    columnMapping.forEach((v, k) => (prefix += `'${k}' as '${v}', `));
    prefix = prefix.slice(0, -2) + " from (\n";
    return `${prefix}${sql}\n)`;
  }
  return sql;
}

export type ReturnedMDX = {
  str1: string;
  str2: string;
};

/**
 * Extracts and processes a query from an MDX expression string.
 *
 * @param expression - The MDX expression as a string or array of strings
 * @param passObject - Object containing MDX query information
 * @param complexMsgs - Set to store complex query messages
 * @param unknownMsgs - Set to store unknown query messages
 * @returns The processed query string, or empty string if query cannot be processed
 *
 * @remarks
 * The function handles three types of expressions:
 * - Direct SELECT statements (returned as-is)
 * - LET SOURCE statements with NATIVEQUERY
 * - LET SOURCE statements with QUERY
 * If the expression doesn't match these patterns, it adds messages to the provided Sets and returns empty string.
 */
export function queryFromExpression(
  expression: string | string[],
  passObject: ReturnedMDX,
  complexMsgs: Set<string>,
  unknownMsgs: Set<string>,
): string {
  const exprStr = expressionAsString(expression);
  if (exprStr.toLowerCase().startsWith("select ")) {
    // Don't see this in current test files
    return exprStr;
  } else if (exprStr.toLowerCase().startsWith("let source")) {
    if (exprStr.toLowerCase().includes("nativequery")) {
      return addRenamedColumns(exprStr, nativeQueryString(exprStr));
    } else if (exprStr.toLowerCase().includes("query=")) {
      return addRenamedColumns(exprStr, queryString(exprStr));
    } else {
      complexMsgs.add(passObject.str1);
      return "";
    }
  } else {
    unknownMsgs.add(passObject.str1);
    return "";
  }
}

// Needs to extract the select statement from the full string
export function nativeQueryString(inputString: string): string {
  const startMarker = '[data], "'; // Start of the SQL query
  const endMarker = '", null,'; // End of the SQL query
  const startIndex = inputString.toLowerCase().indexOf(startMarker);
  const endIndex = inputString.toLowerCase().indexOf(endMarker, startIndex);

  if (startIndex !== -1 && endIndex !== -1) {
    return inputString
      .substring(startIndex + startMarker.length, endIndex)
      .trim();
  }
  return "";
}

// Needs to extract the select statement from the full string where query starts with "Query="
export function queryString(inputString: string): string {
  const startMarker = '[query="'; // Start of the SQL query
  const endMarker = '"])'; // End of the SQL query
  const startIndex = inputString.toLowerCase().indexOf(startMarker);
  const endIndex = inputString.toLowerCase().indexOf(endMarker, startIndex);

  let result = inputString
    .substring(startIndex + startMarker.length, endIndex)
    .trim();
  result = replaceAll(result, "#(lf)", "\n");
  if (startIndex !== -1 && endIndex !== -1) {
    return result;
  }
  return "";
}

// Look for first "{" after "Table.RenameColumns". Find closing "}" by counting bracket pairs
function extractColumnMapping(
  expression: string,
): Map<string, string> | undefined {
  const start = expression.indexOf("Table.RenameColumns");
  if (start > 0) {
    let subStr = expression.substring(expression.indexOf("{", start));
    let count = 0;
    for (let i = 1; i < subStr.length; i++) {
      if (subStr[i] == "{") count++;
      if (subStr[i] == "}") count--;
      if (count < 0) {
        subStr = subStr.slice(1, i);
        const pairs = subStr.split("}, {");

        // Clean up and parse each key-value pair
        const colMap = new Map(
          pairs.map((pair) => {
            // Remove the curly braces and split by the comma to get key and value
            const [key, value] = pair.replace(/[{}"]/g, "").split(", ");
            return [key, value]; // Return as a key-value tuple for the map
          }),
        );
        return colMap;
      }
    }
  }
  return undefined;
}

/**
 * Converts a given aggregation function name to its abbreviated form.
 *
 * @param aggFn - The aggregation function name to be shortened
 * @returns The abbreviated form of the aggregation function name in lowercase
 */
export function shortAggFn(aggFn: string): string {
  if (aggFn.length <= 3) return aggFn.toLowerCase();
  switch (aggFn.toLowerCase()) {
    case "minimum":
      return "min";
    case "maximum":
      return "max";
    case "average":
      return "avg";
    case "countdistinct":
    case "distinctcount":
      return "dc";
    case "count":
    case "nondistinctcount":
      return "ndc";
  }
  return aggFn.toLowerCase();
}

/**
 * Extracts the dimension unique_name from an MDX dimension reference.
 * E.g., "[dimension_DATE_DIM].[DATE_DIM_Hierarchy]" → "dimension_DATE_DIM"
 *
 * @param dimRef - The MDX dimension reference string
 * @returns The dimension unique_name or undefined if not found
 */
export function extractDimUniqueName(dimRef: string): string | undefined {
  const match = dimRef.match(/^\[([^\]]+)\]/);
  return match ? match[1] : undefined;
}

/**
 * Finds the level unique_name for a given time unit in a time dimension.
 * Used by time intelligence templates to reference the correct level (e.g., Year, Quarter, Month).
 *
 * @param dimUniqueName - The dimension unique_name (e.g., "dimension_DATE_DIM")
 * @param timeUnit - The time unit to find (e.g., "year", "quarter", "month", "day")
 * @param result - The SmlConverterResult containing converted dimensions
 * @param bim - Optional BIM model for fallback when dimensions aren't converted yet
 * @returns The level unique_name (e.g., "D_YEAR") or undefined if level doesn't exist
 */
export function resolveTimeLevelByUnit(
  dimUniqueName: string,
  timeUnit: "year" | "quarter" | "month" | "week" | "day",
  result: SmlConverterResult,
  bim?: BimRoot,
): string | undefined {
  // Try to find from converted dimensions first
  for (const dim of result.dimensions) {
    if (dim.unique_name === dimUniqueName) {
      // Search level_attributes for matching time_unit
      for (const la of dim.level_attributes) {
        if ("time_unit" in la && la.time_unit === timeUnit) {
          return la.unique_name;
        }
      }
      // If looking for year/quarter/month/week but dim only has day level,
      // don't fall back - the ParallelPeriod requires the specific level to exist
      // Return undefined to signal failure
    }
  }

  // Fallback: use BIM model to find column by time unit heuristics
  // This is needed because dimensions may not be converted yet during DAX conversion
  if (bim) {
    // Extract table name from dimension unique_name (e.g., "dimension_DATE_DIM" → "DATE_DIM")
    const tableName = dimUniqueName.replace(/^dimension[_.]?/i, "");
    const table = bim.model.tables.find(
      (t) => t.name.toLowerCase() === tableName.toLowerCase()
    );

    if (table?.columns) {
      for (const col of table.columns) {
        const colTimeUnit = getTimeUnitFromColumnName(col.name);
        if (colTimeUnit === timeUnit) {
          return col.name;
        }
      }
    }
  }

  // Return undefined to indicate no matching level found
  // Callers should handle this by failing conversion (producing TODO stub)
  return undefined;
}

/**
 * Determines the time unit from a column name using heuristics.
 * Mirrors the logic in DimensionConverter.convertTimeUnit().
 *
 * Note: Order matters - check specific patterns (e.g., _moy, _qoy) before
 * generic patterns (e.g., month, quarter) to avoid false matches like
 * D_MONTH_SEQ matching "month" when D_MOY is the correct level.
 */
function getTimeUnitFromColumnName(
  columnName: string
): "year" | "quarter" | "month" | "week" | "day" | undefined {
  const name = columnName.toLowerCase();

  // Year - check specific patterns first
  if (name.includes("year")) {
    return "year";
  }

  // Quarter - check specific abbreviations first
  if (
    name.includes("_qoy") ||
    name.endsWith("qoy") ||
    name === "quarter" ||
    name.endsWith("_quarter") ||
    name.includes("qtr")
  ) {
    return "quarter";
  }

  // Month - check specific abbreviations first (avoid matching "month_seq")
  if (
    name.includes("_moy") ||
    name.endsWith("moy") ||
    name === "month" ||
    name.endsWith("_month") ||
    name.includes("mth")
  ) {
    return "month";
  }

  // Week
  if (name.includes("week")) {
    return "week";
  }

  // Day
  if (name.includes("day") || name.includes("date")) {
    return "day";
  }

  return undefined;
}

/**
 * Resolves a BIM table/column reference to an MDX dimension hierarchy reference.
 * Used by time intelligence functions (TOTALYTD, TOTALMTD, etc.) to map
 * DAX dimension column references to SML hierarchy paths.
 *
 * @param tableName - The BIM table name (e.g., "DATE_DIM")
 * @param columnName - The BIM column name (e.g., "D_DATE") - currently unused but reserved for future column-specific resolution
 * @param result - The SmlConverterResult containing converted dimensions
 * @param bim - Optional BIM model for fallback lookup when dimensions aren't yet populated
 * @returns MDX hierarchy reference string like "[dimension.DATE_DIM].[DATE_DIM Hierarchy]" or undefined if not found
 *
 * Resolution strategy:
 * 1. Lookup: search result.dimensions for matching label or dataset table name
 * 2. BIM fallback: search BIM model for hierarchy names
 * 3. Final fallback: use convention [dimension.{TableName}].[{TableName} Hierarchy]
 */
export function resolveDimensionHierarchy(
  tableName: string,
  columnName: string,
  result: SmlConverterResult,
  bim?: BimRoot,
): string | undefined {
  // Lookup: search dimensions for matching label (table name)
  for (const dim of result.dimensions) {
    if (dim.label === tableName) {
      // Found matching dimension by label
      const hierarchyName =
        dim.hierarchies?.[0]?.unique_name || `${tableName} Hierarchy`;
      return `[${dim.unique_name}].[${hierarchyName}]`;
    }
  }

  // Check if any dimension has level_attributes with dataset matching the table
  const datasetUniqueName = makeUniqueName(`dataset.${tableName}`);
  for (const dim of result.dimensions) {
    for (const la of dim.level_attributes) {
      if ("dataset" in la && la.dataset === datasetUniqueName) {
        const hierarchyName =
          dim.hierarchies?.[0]?.unique_name || `${tableName} Hierarchy`;
        return `[${dim.unique_name}].[${hierarchyName}]`;
      }
    }
  }

  // BIM fallback: look up hierarchy name from BIM model when dimensions aren't yet populated
  if (bim) {
    const table = bim.model.tables.find(
      (t) => t.name.toLowerCase() === tableName.toLowerCase(),
    );
    if (table?.hierarchies?.length) {
      // Use the first hierarchy name from BIM (converted to unique_name format)
      const hierarchyUniqueName = makeUniqueName(table.hierarchies[0].name);
      const dimUniqueName = makeUniqueName(`dimension.${tableName}`);
      return `[${dimUniqueName}].[${hierarchyUniqueName}]`;
    }
    // Table exists but has no hierarchies - use convention-based reference
    if (table) {
      const dimUniqueName = makeUniqueName(`dimension.${tableName}`);
      const hierarchyUniqueName = makeUniqueName(`${tableName}_Hierarchy`);
      return `[${dimUniqueName}].[${hierarchyUniqueName}]`;
    }
  }

  // No dimension found and table doesn't exist - return undefined
  // The calling code should handle this and produce a TODO stub
  return undefined;
}
