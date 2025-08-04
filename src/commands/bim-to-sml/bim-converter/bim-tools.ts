
import { expressionAsString, replaceAll } from "./tools";

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

function addRenamedColumns(expression: string, sql: string): string {
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

// Needs to extract the select statement from the full string
function nativeQueryString(inputString: string): string {
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
function queryString(inputString: string): string {
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
