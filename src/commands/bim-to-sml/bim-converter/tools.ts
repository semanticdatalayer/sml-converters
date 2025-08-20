import { Logger } from "../../../shared/logger";
import { BimMeasure, BimTable, BimTableColumn } from "../bim-models/bim-model";
import { Constants } from "../bim-models/constants";

/**
 * Converts a Set of strings into an alphabetically sorted string representation
 * @param set - The Set of strings to convert
 * @param delim - The delimiter to use between elements
 * @param maxNumElements - Optional maximum number of elements to include in output
 * @returns A string of the Set's elements sorted alphabetically and joined with the delimiter.
 * If numElements is specified and the Set is larger, returns only the first numElements followed by "..."
 * Returns empty string if Set is empty
 */
export function setToStringAlphabetical(
  set: Set<string>,
  delim: string,
  maxNumElements?: number,
): string {
  if (set.size == 0) return "";
  let arr = Array.from(set).sort((a, b) => a.localeCompare(b));
  if (maxNumElements !== undefined && arr.length > maxNumElements) {
    arr = arr.slice(0, maxNumElements);
    return arr.join(delim) + "...";
  }
  return arr.join(delim);
}

/**
 * Converts an array of strings to a single, sorted, delimited string
 * @param arr - The array of strings to be converted
 * @param delim - The delimiter to join the sorted strings
 * @returns An empty string if the array is empty, otherwise returns the sorted strings joined by the delimiter
 */
export function arrayToStringAlphabetical(arr: string[], delim: string) {
  if (arr.length == 0) return "";
  return arr.sort((a, b) => a.localeCompare(b)).join(delim);
}

/**
 * Converts string to lowercase and removes spaces
 */
export function lowerNoSpace(name: string): string {
  return name.toLowerCase().replace(/ /g, "");
}

/**
 * Removes all single and double quotes from a string
 */
export function noQuotes(field: string): string {
  return field.toString().replace(/["']/g, "");
}

/**
 * Converts an expression to a formatted string representation.
 *
 * @param expression - The input expression, which can be either a string or an array of strings
 * @returns A formatted string where:
 *  - Array expressions are joined with newlines
 *  - "let\n" is replaced with "let "
 *  - Multiple spaces are consolidated into single spaces
 *  - Returns empty string if expression is falsy
 */
export function expressionAsString(expression: string | Array<string>): string {
  if (expression) {
    let result = (
      Array.isArray(expression) ? expression.join("\n").toString() : expression
    ).replace("let\n", "let ");
    // Replace multiple spaces with a single space
    result = result.replace(/\s+/g, " ");
    return result;
  }
  return "";
}

/** Converts a description input of string, string array, or undefined to a unified string format */
export function descriptionAsString(
  input: string | Array<string> | undefined,
): string | undefined {
  if (input) {
    return Array.isArray(input) ? input.join("").toString() : input;
  }
  return undefined;
}

/** Replaces all occurrences of a string within another string */
export function replaceAll(str: string, find: string, replace: string): string {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

/** Escapes special characters in a string for use in a regular expression */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function isHidden(c: BimTableColumn | BimMeasure | BimTable): boolean {
  if (c.isHidden) return true;
  return false;
}

/** Converts a string expression to a comment, replaces it with a null value */
export function exprToComment(
  expression: string | undefined,
): string | undefined {
  if (!expression) return undefined;
  return `null /*${expression} TODO: Replace with valid SQL*/`;
}

export function incrementNumberMap(
  metricLabels: Map<string, number>,
  key: string,
) {
  const val = metricLabels.get(key.toLowerCase());
  if (val) {
    metricLabels.set(key.toLowerCase(), val + 1);
  } else {
    metricLabels.set(key.toLowerCase(), 1);
  }
}

export function cleanFileName(name: string): string {
  let cleanName = "";

  // Iterate through each character in the original string
  for (let i = 0; i < name.length; i++) {
    const c = name.charCodeAt(i); // Get the Unicode value of the character
    if (Constants.ILLEGAL_FILENAME_CHARS.indexOf(c) < 0) {
      cleanName += String.fromCharCode(c); // If not an illegal character, append it to cleanName
    } else {
      cleanName += "_"; // Replace illegal characters with an underscore
    }
  }
  return cleanName;
}

/**
 * Generates a simplified stack trace string containing the 3 most recent call
 * frames and makes them into a readable string with line numbers.
 *
 * @returns A formatted string containing up to 3 stack frames, each prefixed with a number
 * and newline. Returns empty string if stack trace is unavailable.
 */
export function printShortStack(): string {
  const error = new Error();
  const stack = error.stack?.split("\n");
  let out = "";
  stack?.slice(2, 5).forEach((line, index) => {
    out += `\n   ${index + 1}: ${line.trim()}`;
  });
  return out;
}

export const errorUtil = {
  getErrorMessage(e: unknown): string {
    if (!e) {
      return "unknown error";
    }
    if (e instanceof Error) {
      return e.message;
    }
    if (typeof e === "string") {
      return e;
    }
    return `${e}`;
  },
  getError(e: unknown): Error {
    return new Error(this.getErrorMessage(e));
  },
};

export function removeComments(input: string): string {
  // Remove text between comments like /* ... */
  let retVal = input
    .replace(/\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|^\/\/.*/g, "")
    .trim();
  // Remove single-line comments that use --
  retVal = retVal.replace(/--.*$/gm, "");
  return retVal;
}

export function createUniqueAttrName(
  attrNameMap: Map<string, string[]>,
  name: string,
  verboseName: string,
  type: string,
  bimTable: string,
  firstSuffix: string,
  logger: Logger,
): string {
  // The unique_name is used for the file name so need to make sure it doesn't use invalid characters
  const cleanName = cleanFileName(name);
  // Base case passes so no message needed
  if (
    name.toLowerCase() === cleanName.toLowerCase() &&
    !attrNameMap.get(name.toLowerCase()) &&
    name.length < Constants.MAX_UNIQUE_NAME_LENGTH
  ) {
    attrNameMap.set(name.toLowerCase(), [type, bimTable]);
    attrNameMap.set(verboseName.toLowerCase(), [name]);
    return name;
  }
  // Check if it exceeds max character limit
  if (
    name.toLowerCase() === cleanName.toLowerCase() &&
    name.length > Constants.MAX_UNIQUE_NAME_LENGTH
  ) {
    const shortName = getShortUniqueName(
      cleanName.toLowerCase(),
      attrNameMap,
      firstSuffix,
    );
    if (!shortName) return warnAndReturn(name, logger);
    logger.warn(
      `JDBC limit of ${Constants.MAX_UNIQUE_NAME_LENGTH} characters exceeded by unique name '${name}' so '${shortName}' will be used instead`,
    );
    return updateAttrNameMap(
      attrNameMap,
      shortName,
      [type, bimTable],
      verboseName,
    );
  }
  // File name would have invalid characters
  if (name.toLowerCase() !== cleanName.toLowerCase()) {
    // Use it if we can
    if (
      !attrNameMap.get(cleanName.toLowerCase()) &&
      cleanName.length <= Constants.MAX_UNIQUE_NAME_LENGTH
    ) {
      logger.warn(
        `File names use object unique names and '${name}' contains characters invalid for file naming. Creating as '${cleanName}' on table '${bimTable}'`,
      );
      return updateAttrNameMap(
        attrNameMap,
        cleanName,
        [type, bimTable],
        verboseName,
      );
    }
    // Already exists or exceeds character limit
    const shortName = getShortUniqueName(
      cleanName + "_" + bimTable,
      attrNameMap,
      "",
    );
    if (!shortName) warnAndReturn(shortName, logger);
    logger.warn(
      `File names use object unique names and '${name}' would conflict with another file so creating as '${shortName}' on table '${bimTable}'`,
    );
    return updateAttrNameMap(
      attrNameMap,
      shortName,
      [type, bimTable],
      verboseName,
    );
  }
  // Name already exists
  const val = attrNameMap.get(name.toLowerCase());
  if (val)
    return handleNameExists(
      cleanName,
      name,
      verboseName,
      bimTable,
      attrNameMap,
      val,
      type,
      firstSuffix,
      logger,
    );
  // Shouldn't hit this
  logger.warn(
    `Creating measure or attribute with unique name '${name}' which could conflict with another unique name`,
  );
  attrNameMap.set(verboseName.toLowerCase(), [name]);
  return name;
}

export function lookupAttrUniqueName(
  attrNameMap: Map<string, string[]>,
  lookupName: string,
  showMessage: boolean,
  logger: Logger,
): string | undefined {
  const resultAry = attrNameMap.get(lookupName.toLowerCase());
  if (resultAry?.length == 1) {
    return resultAry[0];
  }
  if (showMessage) {
    logger.warn(
      `Failed to find attribute unique name for lookup value of ${lookupName} from: ${printShortStack()}`,
    );
  }
  return undefined;
}

export function getShortUniqueName(
  name: string,
  attrNameMap: Map<string, string[]>,
  firstSuffix: string,
): string {
  if (
    name.length < Constants.MAX_UNIQUE_NAME_LENGTH &&
    !attrNameMap.has(name.toLowerCase())
  )
    return name;
  let newName = "";
  if (firstSuffix) {
    // Try adding the first suffix passed (aggregation function)
    newName =
      name.substring(
        0,
        Constants.MAX_UNIQUE_NAME_LENGTH - firstSuffix.length - 1,
      ) + `_${firstSuffix}`;
    if (!attrNameMap.has(newName.toLowerCase())) return newName;
  }

  // Try adding a suffix
  for (let i = 1; i < 1000; i++) {
    newName =
      name.substring(
        0,
        Constants.MAX_UNIQUE_NAME_LENGTH - String(i).length - 1,
      ) + `_${i}`;
    if (!attrNameMap.has(newName.toLowerCase())) return newName;
  }
  return ""; // Can't find a name not already used. Shouldn't hit this
}

export function handleNameExists(
  cleanName: string,
  name: string,
  verboseName: string,
  bimTable: string,
  attrNameMap: Map<string, string[]>,
  val: string[],
  type: string,
  firstSuffix: string,
  logger: Logger,
): string {
  const shortName = getShortUniqueName(
    cleanName + "_" + bimTable,
    attrNameMap,
    firstSuffix,
  );
  if (!shortName) warnAndReturn(shortName, logger);
  const aggForMsg = firstSuffix ? `with aggregation '${firstSuffix}' ` : ``;
  if (val.length == 2) {
    if (!name.startsWith("countrows"))
      logger.warn(
        `Unique name '${name}' is already being used by table '${val[1]}' as a '${val[0]}' so '${type}' ${aggForMsg}on table '${bimTable}' will use unique_name '${shortName}'`,
      );
  } else {
    logger.warn(
      `Unique name '${name}' is already being used on table '${val[0]}' so '${type}' ${aggForMsg}on table '${bimTable}' will use unique_name '${shortName}'`,
    );
  }
  return updateAttrNameMap(
    attrNameMap,
    shortName,
    [type, bimTable],
    verboseName,
  );
}

export function updateAttrNameMap(
  attrNameMap: Map<string, string[]>,
  shortName: string,
  params: string[],
  verboseName: string,
): string {
  attrNameMap.set(shortName.toLowerCase(), params);
  attrNameMap.set(verboseName.toLowerCase(), [shortName]);
  return shortName;
}

export function makeUniqueName(name: string): string {
  let result = name;
  result = replaceAll(result, "%", "pct");
  result = replaceAll(result, "&", "and").replace(/[ #.()&?%-+/]/g, "_");
  result = replaceAll(result, "_-_", "-");
  result = replaceAll(result, "___", "_");
  result = replaceAll(result, "__", "_").replace(/_+$/, "");

  return result;
}

export function warnAndReturn(name: string, logger: Logger): string {
  logger.warn(
    `JDBC limit of ${Constants.MAX_UNIQUE_NAME_LENGTH} characters exceeded by unique name of '${name}' and no suitable replacement name was found. Using original name which will hit the limit`,
  );
  return name;
}
