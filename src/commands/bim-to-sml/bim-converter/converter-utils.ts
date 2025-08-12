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
  if (meas?.expression /*  && !Array.isArray(meas.expression)*/) {
    const exprLowerNoSpace = lowerNoSpace(meas.expression);
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
): string {
  for (const d of result.dimensions) {
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
