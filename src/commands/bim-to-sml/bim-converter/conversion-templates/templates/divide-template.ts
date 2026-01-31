import {
  ConversionTemplate,
  ConversionExample,
} from "../template-base";
import { DaxToken, FunctionToken, CommaToken, OperatorToken } from "../../dax-converter";
import {
  ConversionResult,
  ConversionCategory,
  successfulConversion,
  failedConversion,
} from "../../conversion-result";
import { ConversionContext } from "../conversion-context";

/**
 * DAX functions that return boolean values.
 */
const BOOLEAN_RETURNING_FUNCTIONS = new Set([
  "ISFILTERED",
  "ISCROSSFILTERED",
  "HASONEVALUE",
  "HASONEFILTER",
  "ISBLANK",
  "ISERROR",
  "ISLOGICAL",
  "ISNONTEXT",
  "ISNUMBER",
  "ISTEXT",
  "CONTAINS",
  "CONTAINSROW",
  "CONTAINSSTRING",
  "CONTAINSSTRINGEXACT",
  "NOT",
]);

/**
 * Check if tokens represent a boolean expression.
 * Detects NOT() functions, boolean operators (&&, ||), and boolean-returning functions.
 */
function isBooleanExpression(tokens: DaxToken[]): boolean {
  for (const token of tokens) {
    // Check for boolean operators
    if (token instanceof OperatorToken) {
      const op = token.value.toUpperCase();
      if (op === "&&" || op === "||" || op === "AND" || op === "OR") {
        return true;
      }
    }
    // Check for boolean-returning functions
    if (token instanceof FunctionToken) {
      const funcName = token.functionAgg.toUpperCase();
      if (BOOLEAN_RETURNING_FUNCTIONS.has(funcName)) {
        return true;
      }
      // Recursively check function arguments
      if (isBooleanExpression(token.args)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * DivideTemplate converts DAX DIVIDE function to MDX division.
 *
 * Handles three forms:
 * 1. DIVIDE(numerator, denominator)
 *    → (numerator) / (denominator)
 *    Confidence: 1.0 (semantically equivalent)
 *
 * 2. DIVIDE(numerator, denominator, alternate_result)
 *    → IIF(denominator = 0, alternate_result, (numerator) / (denominator))
 *    Confidence: 1.0 (semantically equivalent)
 *
 * 3. DIVIDE(numerator, boolean_expression) - DAX idiom for conditional display
 *    → IIF(boolean_expression, numerator, NULL)
 *    Confidence: 0.9 (DAX idiom where TRUE passes through, FALSE returns BLANK)
 *
 * DAX DIVIDE returns alternate_result when denominator is 0 or BLANK.
 * MDX IIF with zero check provides equivalent behavior.
 */
export class DivideTemplate extends ConversionTemplate {
  readonly name = "DivideTemplate";
  readonly confidence = 1.0;

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    // Must have exactly one token at root level
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];

    // Must be a DIVIDE function
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    if (token.functionAgg.toUpperCase() !== "DIVIDE") {
      return false;
    }

    // Validate argument structure
    const argCount = this.countArguments(token.args);

    // DIVIDE requires 2 or 3 arguments
    if (argCount < 2 || argCount > 3) {
      this.warn(
        `DIVIDE function has ${argCount} arguments, expected 2 or 3`,
        context,
      );
      return false;
    }

    // CRITICAL: Reject if arguments contain unconvertible functions
    // Per CLAUDE.md: "Converted MDX should never use functions not supported by AtScale (SUMX, FILTER, RELATED...)"
    if (this.containsUnconvertibleFunctions(token.args, context)) {
      this.warn(
        `DIVIDE arguments contain unconvertible functions (SUMX, FILTER, RELATED, etc.) - rejecting conversion`,
        context,
      );
      return false;
    }

    return true;
  }

  convert(tokens: DaxToken[], context: ConversionContext): ConversionResult {
    const token = tokens[0] as FunctionToken;
    const args = token.args;

    // Find argument boundaries (split by commas)
    const argGroups = this.splitArguments(args);

    if (argGroups.length < 2 || argGroups.length > 3) {
      return failedConversion(
        `DIVIDE requires 2 or 3 arguments, got ${argGroups.length}`,
        token.functionAgg,
      );
    }

    try {
      // Convert argument tokens to MDX - may recursively invoke templates
      const numeratorMdx = this.convertSubExpression(argGroups[0], context);
      const denominatorMdx = this.convertSubExpression(argGroups[1], context);

      // CRITICAL: Check if either argument conversion failed (returned empty string)
      if (!denominatorMdx || denominatorMdx.trim() === "") {
        return failedConversion(
          `DIVIDE denominator conversion failed - cannot create valid MDX with empty denominator`,
          token.functionAgg,
        );
      }
      if (!numeratorMdx || numeratorMdx.trim() === "") {
        return failedConversion(
          `DIVIDE numerator conversion failed - cannot create valid MDX with empty numerator`,
          token.functionAgg,
        );
      }

      if (argGroups.length === 2) {
        // Check if denominator is a boolean expression (DAX idiom for conditional display)
        // DIVIDE(value, boolean) in DAX means: if boolean is TRUE, return value; if FALSE, return BLANK
        if (isBooleanExpression(argGroups[1])) {
          // Check if converted boolean expression contains bare measure references
          // that would cause MDX type errors (measure stubs are IntType, AND/OR require BooleanType)
          // Pattern: [Measures].[X] not followed by comparison operator or preceded by NOT
          // Bare measure refs in boolean context are invalid - reject and fallback to TODO
          if (this.hasBooleanTypeMismatch(denominatorMdx)) {
            return failedConversion(
              `DIVIDE boolean denominator contains measure references in AND/OR context - MDX AND/OR requires BooleanType but measures are IntType`,
              "DIVIDE",
            );
          }

          // Convert to: IIF(boolean, numerator, NULL)
          const mdxExpression = `IIF(${denominatorMdx}, ${numeratorMdx}, NULL)`;

          return successfulConversion(
            mdxExpression,
            0.9, // Slightly lower confidence for idiom conversion
            ConversionCategory.TEMPLATE_CONVERSION,
            {
              originalDax: `DIVIDE(${numeratorMdx}, ${denominatorMdx})`,
              method: "divide_template_boolean_denom",
              note: "DAX idiom: DIVIDE by boolean converted to IIF conditional",
            },
          );
        }

        // 2-arg form: DIVIDE(num, denom) → (num) / (denom)
        const mdxExpression = `(${numeratorMdx}) / (${denominatorMdx})`;

        return successfulConversion(
          mdxExpression,
          this.confidence,
          ConversionCategory.TEMPLATE_CONVERSION,
          {
            originalDax: `DIVIDE(${numeratorMdx}, ${denominatorMdx})`,
            method: "divide_template_2arg",
          },
        );
      } else {
        // 3-arg form: DIVIDE(num, denom, alt) → IIF(denom = 0, alt, (num) / (denom))
        const alternateResultMdx = this.convertSubExpression(argGroups[2], context);

        // CRITICAL: Check if alternate result conversion failed
        if (!alternateResultMdx || alternateResultMdx.trim() === "") {
          return failedConversion(
            `DIVIDE alternate result conversion failed - cannot create valid MDX with empty alternate`,
            token.functionAgg,
          );
        }

        const mdxExpression =
          `IIF(${denominatorMdx} = 0, ${alternateResultMdx}, (${numeratorMdx}) / (${denominatorMdx}))`;

        return successfulConversion(
          mdxExpression,
          this.confidence,
          ConversionCategory.TEMPLATE_CONVERSION,
          {
            originalDax: `DIVIDE(${numeratorMdx}, ${denominatorMdx}, ${alternateResultMdx})`,
            method: "divide_template_3arg",
          },
        );
      }
    } catch (error) {
      return failedConversion(
        `Failed to convert DIVIDE: ${error instanceof Error ? error.message : String(error)}`,
        token.functionAgg,
      );
    }
  }

  getExamples(): ConversionExample[] {
    return [
      {
        dax: "DIVIDE(Sales, Quantity)",
        mdx: "(Sales) / (Quantity)",
        description: "Simple 2-argument division",
      },
      {
        dax: "DIVIDE([Total Sales], [Total Units])",
        mdx: "([Total Sales]) / ([Total Units])",
        description: "Division with measure references",
      },
      {
        dax: "DIVIDE(Sales, Quantity, 0)",
        mdx: "IIF(Quantity = 0, 0, (Sales) / (Quantity))",
        description: "3-argument form with alternate result",
      },
      {
        dax: "DIVIDE(Profit, Revenue, BLANK())",
        mdx: "IIF(Revenue = 0, BLANK(), (Profit) / (Revenue))",
        description: "3-argument form with BLANK alternate",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX DIVIDE function to MDX division. " +
      "2-arg form becomes simple division. " +
      "3-arg form becomes IIF with zero-check for safe division."
    );
  }

  /**
   * Count the number of arguments (comma-separated groups)
   */
  private countArguments(args: DaxToken[]): number {
    let count = args.length > 0 ? 1 : 0;
    for (const token of args) {
      if (token instanceof CommaToken) {
        count++;
      }
    }
    return count;
  }

  /**
   * Split arguments by commas into groups
   * @returns Array of token groups (one per argument)
   */
  private splitArguments(args: DaxToken[]): DaxToken[][] {
    const groups: DaxToken[][] = [];
    let currentGroup: DaxToken[] = [];

    for (const token of args) {
      if (token instanceof CommaToken) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
          currentGroup = [];
        }
      } else {
        currentGroup.push(token);
      }
    }

    // Add final group
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Check if a converted MDX boolean expression has type mismatch issues.
   * Detects bare measure references used in AND/OR context without comparison operators.
   * MDX AND/OR require BooleanType, but measure stubs are IntType (1 or 0).
   *
   * Valid patterns (measure in comparison):
   * - [Measures].[X] > 0
   * - [Measures].[X] = 1
   * - NOT([Measures].[X]) - handled separately with TODO stub
   *
   * Invalid patterns (bare measure in boolean context):
   * - ... AND [Measures].[X]
   * - [Measures].[X] AND ...
   * - ... OR [Measures].[X]
   */
  private hasBooleanTypeMismatch(mdxExpression: string): boolean {
    // Look for measure references followed by AND/OR (not preceded by comparison)
    // Patterns that indicate bare measure used as boolean operand:
    // - [Measures].[X]] AND  (note: double ]] from MDX syntax)
    // - AND [Measures].[X]
    // - OR [Measures].[X]
    // - [Measures].[X]] OR

    // Check for pattern: [Measures].[...] immediately followed by AND or OR
    // This regex looks for measure reference followed by ] then AND/OR
    const measureBeforeAndOr = /\[Measures\]\.\[[^\]]+\]\s*(AND|OR)\s/i;
    if (measureBeforeAndOr.test(mdxExpression)) {
      return true;
    }

    // Check for pattern: AND or OR immediately followed by [Measures]
    // But NOT if it's part of (1 = 0) which is our TODO stub for NOT(measure)
    // First, remove our TODO stubs from consideration
    const withoutTodoStubs = mdxExpression.replace(/\(1 = 0\)\s*\/\*[^*]*\*\//g, "TRUE");

    const andOrBeforeMeasure = /\b(AND|OR)\s+\[Measures\]\./i;
    if (andOrBeforeMeasure.test(withoutTodoStubs)) {
      return true;
    }

    return false;
  }
}
