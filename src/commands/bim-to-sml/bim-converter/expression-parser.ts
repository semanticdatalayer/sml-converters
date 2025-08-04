import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { BimRoot } from "../bim-models/bim-model";
import { ReturnedMDX } from "./bim-tools";
import { Constants } from "../bim-models/constants";
import { MeasureConverter } from "./measure-converter";
import { lowerNoSpace, noQuotes } from "./tools";
import {
  AttributeMaps,
  ExtractedMeasure,
} from "../bim-models/types-and-interfaces";
import { Logger } from "../../../shared/logger";

// Returns the initial MDX measure as str1 and remaining DAX expression as str2
// Example: str1: "[Measures].[HasOneCurrency]", str2: ",[TestSimpleMinMeas])"
export function initialMetric(
  e: string,
  bim: BimRoot,
  tableName: string,
  result: SmlConverterResult,
  attrMaps: AttributeMaps,
  unusedTables: Set<string>,
  logger: Logger,
): ReturnedMDX | undefined {
  const measureConverter = new MeasureConverter(logger);
  let newExpr = "";
  while (e.length > 0) {
    const sepExpr = removeMathOnly(e);
    if (sepExpr?.str2) {
      if (lowerNoSpace(sepExpr.str2).startsWith("divide(")) {
        const newResult = extractDivideFromExpression(
          bim,
          sepExpr.str2,
          tableName,
          result,
          attrMaps,
          unusedTables,
          logger,
        );
        if (newResult) {
          if (newResult.str1) newExpr += " " + newResult.str1;
          if (newResult.str2) {
            e = newResult.str2;
          } else {
            return { str1: newExpr, str2: "" };
          }
        } else {
          return undefined;
        }
      } else {
        // Could be agg(tbl[col])... or countrows(tbl)... or [meas]
        const newMeas = measureNameFromString(
          bim,
          sepExpr.str2,
          tableName,
          result,
          attrMaps,
          unusedTables,
          measureConverter,
        );
        if (sepExpr.str1) newExpr += sepExpr.str1;
        if (!newMeas) {
          // Found non-math and non-measure
          return { str1: newExpr, str2: sepExpr.str2 };
        } // Something other than math or a measure was found
        newExpr += newMeas.measName;
        e = newMeas.newExpr;
      }
    } else if (sepExpr?.str1) {
      newExpr += sepExpr.str1;
      return { str1: newExpr, str2: "" };
    } else return { str1: newExpr, str2: "" };
  }
  // Returns the SML expression and remaining bim measure expression
  if (newExpr.length > 0) return { str1: newExpr, str2: "" };
  return undefined;
}

// Looks for [metric] or sum(<table>[<col>]) or countrows(<table>) in string and return the metric and rest of string
export function measureNameFromString(
  bim: BimRoot,
  expr: string,
  tableName: string,
  result: SmlConverterResult,
  attrMaps: AttributeMaps,
  unusedTables: Set<string>,
  measureConverter: MeasureConverter,
): ExtractedMeasure | undefined {
  if (expr) {
    if (lowerNoSpace(expr).startsWith("[")) {
      const refMetricName = expr.substring(
        expr.indexOf("[") + 1,
        expr.indexOf("]"),
      );
      const m = attrMaps.metricLookup.get(
        "calc" + lowerNoSpace(tableName + "[" + refMetricName + "]"),
      );
      if (m) {
        return {
          measName: `[Measures].[${m.uniqueName}]`, // Need original casing here
          newExpr: expr.substring(expr.indexOf("]") + 1),
          tableName: tableName,
        };
      }
      return undefined;
    }

    const aggFn = aggFunctionAtStart(lowerNoSpace(expr));
    if (aggFn !== "none") {
      if (expr.includes("(") && expr.includes(")")) {
        const fnBlock = expr.substring(0, expr.indexOf(")") + 1);
        const e = noQuotes(lowerNoSpace(fnBlock));
        if (isSimpleFunctionWithCol(e)) {
          const simpleDef = e.substring(
            e.indexOf("(") + 1,
            firstIndexAfterSquareBrackets(e, ")"),
          ); // e: sum(pocvalues[toptaskid]) -> pocvalues[toptaskid]

          // Need to see if this metric exists, and if not create it
          const m = attrMaps.metricLookup.get(aggFn + simpleDef);
          if (m) {
            return {
              measName: `[Measures].[${m.uniqueName}]`,
              newExpr: expr.substring(expr.indexOf(")") + 1),
              tableName: m.table,
            };
          } else {
            // Create measure for simple aggregation
            const refColName = simpleDef.substring(
              simpleDef.indexOf("[") + 1,
              simpleDef.indexOf("]"),
            );
            for (const t of bim.model.tables) {
              if (
                lowerNoSpace(t.name) ===
                simpleDef.substring(0, simpleDef.indexOf("["))
              ) {
                const c = t.columns.find(
                  (c) => lowerNoSpace(c.name) === refColName,
                );
                if (c) {
                  const measureUniqueName =
                    measureConverter.createAndAddMeasureFromColumn(
                      c,
                      t.name,
                      aggFn,
                      result,
                      attrMaps,
                      unusedTables,
                    );
                  if (!measureUniqueName) return undefined;

                  const retVal = {
                    measName: `[Measures].[${measureUniqueName}]`,
                    newExpr: expr.substring(
                      firstIndexAfterSquareBrackets(expr, ")") + 1,
                    ),
                    tableName: t.name,
                  };
                  return retVal;
                }
              }
            }
          }
        } else if (isSimpleCountRowsFunction(e)) {
          const simpleDef = `${e.substring(
            e.indexOf("(") + 1,
            e.indexOf(")"),
          )}[${Constants.ROW_COUNT_COLUMN_NAME}]`;
          const m = attrMaps.metricLookup.get(aggFn + simpleDef);
          if (m) {
            return {
              measName: `[Measures].[${m.uniqueName}]`,
              newExpr: expr.substring(expr.indexOf(")") + 1),
              tableName: m.table,
            };
          } else {
            // Create measure for simple aggregation
            for (const t of bim.model.tables) {
              if (
                lowerNoSpace(t.name) ===
                simpleDef.substring(0, simpleDef.indexOf("["))
              ) {
                const measureUniqueName =
                  measureConverter.createAndAddCountRowsMeasure(
                    t.name,
                    result,
                    attrMaps,
                    unusedTables,
                    true,
                  );
                if (!measureUniqueName) return undefined;
                const retVal = {
                  measName: `[Measures].[${measureUniqueName}]`,
                  newExpr: expr.substring(expr.indexOf(")") + 1),
                  tableName: t.name,
                };
                return retVal;
              }
            }
          }
        }
      }
    }
    return undefined;
  }
}

// Returns the initial math characters as str1 and remaining expression in str2
export function removeMathOnly(e: string): ReturnedMDX | undefined {
  for (let i = 0; i < e.length; i++) {
    if (i == e.length) {
      // Shouldn't hit this case
      return { str1: e.substring(0, i), str2: "" };
    }
    if (!isMathOrWhite(e[i])) {
      if (i == 0) {
        return { str1: "", str2: e };
      }
      // Removing initial math or white space from e
      return { str1: e.substring(0, i), str2: e.substring(i) };
    }
  }
  return { str1: e, str2: "" }; // Only math or white space found
}

/**
 * Extracts and parses a DIVIDE function from a BIM expression and converts it to an MDX division operation.
 *
 * This function extracts the numerator and denominator
 * to construct an equivalent MDX expression using the division operator (/).
 *
 * @param bim - The BIM root object containing the model definition
 * @param e - The expression string to parse
 * @param tableName - The name of the table in context
 * @param result - The converter result object for storing errors or warnings
 * @param attrMaps - Attribute mappings used during conversion
 * @param unusedTables - Set of tables that haven't been used in the conversion
 *
 * @returns An object containing the converted MDX expression and the remaining part of the original expression,
 * or undefined if the expression is not a valid DIVIDE function or cannot be parsed correctly
 */
export function extractDivideFromExpression(
  bim: BimRoot,
  e: string,
  tableName: string,
  result: SmlConverterResult,
  attrMaps: AttributeMaps,
  unusedTables: Set<string>,
  logger: Logger,
): ReturnedMDX | undefined {
  if (lowerNoSpace(e).startsWith("divide(")) {
    const numerator = initialMetric(
      e.substring(e.indexOf("(") + 1),
      bim,
      tableName,
      result,
      attrMaps,
      unusedTables,
      logger,
    );
    if (
      numerator?.str1 &&
      numerator.str2 &&
      lowerNoSpace(numerator.str2).startsWith(",")
    ) {
      const newExpr = numerator.str2.replace(",", "").replace(/[' ]/g, "");
      const denominator = initialMetric(
        newExpr,
        bim,
        tableName,
        result,
        attrMaps,
        unusedTables,
        logger,
      );
      if (
        denominator &&
        denominator.str1 &&
        lowerNoSpace(denominator.str2).startsWith(")")
      ) {
        return {
          str1: `${numerator.str1} / ${denominator.str1}`,
          str2: denominator.str2.substring(denominator.str2.indexOf(")") + 1),
        };
      } else {
        return undefined;
      }
    }
  }
  return undefined;
}

export function aggFunctionAtStart(val: string): string {
  let returnVal = "none";
  Constants.AGG_FNS.forEach((agg) => {
    if (
      val
        .replace(" ", "")
        .toLowerCase()
        .startsWith(agg + "(")
    ) {
      returnVal = agg;
    }
  });
  return returnVal;
}

// Checks that there is exactly 1 of each brace type in order then it's a single table and column
export function isSimpleFunctionWithCol(val: string): boolean {
  const i1 = val.indexOf("(");
  const i2 = val.indexOf("[");
  const i3 = val.indexOf("]");
  const i4 = val.indexOf(")");
  return (
    i1 > -1 &&
    i1 < i2 &&
    i2 < i3 &&
    i3 < i4 &&
    i1 == val.lastIndexOf("(") &&
    i2 == val.lastIndexOf("[") &&
    i3 == val.lastIndexOf("]") &&
    i4 == val.lastIndexOf(")")
  );
}

// There is only a table reference for countrows
export function isSimpleCountRowsFunction(val: string): boolean {
  const charList = ["(", ")"];
  let retVal = true;
  charList.forEach((c) => {
    if (val.split(c).length !== 2) retVal = false;
  });
  if (val.includes("[") || val.includes("]")) retVal = false;
  return retVal;
}

/**
 * Determines if a character is a mathematical operator, digit, parenthesis, or whitespace.
 *
 * @param char - The character to test
 * @returns True if the character is a digit, whitespace, or one of the following: +, -, *, /, (, )
 */
export function isMathOrWhite(char: string): boolean {
  const re = /(\d|\s|\+|-|\*|\/|\(|\)| )+/;
  return re.test(char);
}

export function firstIndexAfterSquareBrackets(
  e: string,
  findChar: string,
): number {
  if (!e) return -1;
  let foundBrace = false;
  for (let i = 0; i < e.length; i++) {
    if (e[i] === "[") {
      foundBrace = true;
      // If "(" exists before the closing "]" then invalid
      if (
        e.indexOf(")") > -1 &&
        e.indexOf("]") > -1 &&
        e.indexOf(")") < e.indexOf("]")
      )
        return -1;
      i = e.indexOf("]");
    }
    if (i == e.length) return -1;
    if (e[i] === findChar) {
      if (foundBrace) return i;
      // If "(" exists before the closing "]" then invalid
      return -1;
    }
  }
  return -1;
}
