import {
  ConversionTemplate,
  ConversionExample,
} from "../template-base";
import { DaxToken, FunctionToken, CommaToken } from "../../dax-converter";
import {
  ConversionResult,
  ConversionCategory,
  successfulConversion,
  failedConversion,
} from "../../conversion-result";
import { ConversionContext } from "../conversion-context";

// String literals that represent null/invalid values in DAX and should be
// converted to NULL in MDX to maintain type consistency
const NULL_PLACEHOLDER_STRINGS = new Set(["N/A", "n/a", "NA", "na", "-", ""]);

/**
 * IfErrorTemplate converts DAX IFERROR function to MDX error handling.
 *
 * DAX: IFERROR(value, value_if_error)
 * Returns value if no error, otherwise returns value_if_error
 *
 * Since AtScale MDX does NOT support IsError, we use ISEMPTY as an approximation.
 * Most real-world IFERROR usage is to handle NULL/blank values from divisions
 * or lookups, so ISEMPTY is a reasonable substitute.
 *
 * DAX: IFERROR([Profit Margin], 0)
 * MDX: IIF(ISEMPTY([Measures].[Profit Margin]), 0, [Measures].[Profit Margin])
 *
 * Confidence: 0.95 (ISEMPTY covers most common error cases)
 */
export class IfErrorTemplate extends ConversionTemplate {
  readonly name = "IfErrorTemplate";
  readonly confidence = 0.95;

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    // Must have exactly one token at root level
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];

    // Must be an IFERROR function
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    const funcName = token.functionAgg.toUpperCase();
    if (funcName !== "IFERROR") {
      return false;
    }

    // IFERROR requires exactly 2 arguments
    const argCount = this.countArguments(token.args);
    if (argCount !== 2) {
      this.warn(
        `IFERROR function has ${argCount} arguments, expected 2`,
        context,
      );
      return false;
    }

    // CRITICAL: Reject if arguments contain unconvertible functions
    if (this.containsUnconvertibleFunctions(token.args, context)) {
      this.warn(
        `IFERROR arguments contain unconvertible functions - rejecting conversion`,
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

    if (argGroups.length !== 2) {
      return failedConversion(
        `IFERROR requires exactly 2 arguments, got ${argGroups.length}`,
        token.functionAgg,
      );
    }

    try {
      // Convert argument tokens to MDX
      const valueMdx = this.convertSubExpression(argGroups[0], context);
      let fallbackMdx = this.convertSubExpression(argGroups[1], context);

      // CRITICAL: AtScale IIF requires both branches to have the same type.
      // DAX allows IFERROR(numeric, "N/A"), but MDX does not support mixed types.
      // Convert string placeholders like "N/A" to NULL when the value is numeric.
      if (this.isNullPlaceholderString(fallbackMdx) && this.looksNumeric(valueMdx)) {
        fallbackMdx = "NULL";
      }

      // IFERROR(value, fallback) → IIF(ISEMPTY(value), fallback, value)
      // Note: AtScale doesn't support IsError, so we use ISEMPTY as approximation
      // This covers the most common IFERROR uses (NULL/blank from divisions/lookups)
      const mdxExpression = `IIF(ISEMPTY(${valueMdx}), ${fallbackMdx}, ${valueMdx})`;

      return successfulConversion(
        mdxExpression,
        this.confidence,
        ConversionCategory.TEMPLATE_CONVERSION,
        {
          originalDax: `IFERROR(${valueMdx}, ${fallbackMdx})`,
          method: "iferror_template",
        },
      );
    } catch (error) {
      return failedConversion(
        `Failed to convert IFERROR: ${error instanceof Error ? error.message : String(error)}`,
        token.functionAgg,
      );
    }
  }

  getExamples(): ConversionExample[] {
    return [
      {
        dax: "IFERROR([Profit Margin], 0)",
        mdx: "IIF(ISEMPTY([Measures].[Profit Margin]), 0, [Measures].[Profit Margin])",
        description: "Return 0 if measure is empty/null",
      },
      {
        dax: "IFERROR([Sales] / [Quantity], 0)",
        mdx: "IIF(ISEMPTY([Sales] / [Quantity]), 0, [Sales] / [Quantity])",
        description: "Return 0 if division results in empty/null",
      },
      {
        dax: "IFERROR([LookupValue], 'Not Found')",
        mdx: "IIF(ISEMPTY([LookupValue]), 'Not Found', [LookupValue])",
        description: "Return 'Not Found' if lookup returns empty",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX IFERROR function to MDX error handling using IIF + ISEMPTY. " +
      "IFERROR(value, fallback) becomes IIF(ISEMPTY(value), fallback, value). " +
      "Note: AtScale doesn't support IsError, so ISEMPTY is used as approximation."
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
   * Check if a converted MDX value is a string placeholder that represents null.
   * DAX often uses strings like "N/A" as null placeholders in numeric contexts.
   */
  private isNullPlaceholderString(mdxValue: string): boolean {
    // Check for double-quoted string literals
    const match = mdxValue.match(/^"([^"]*)"$/);
    if (match) {
      return NULL_PLACEHOLDER_STRINGS.has(match[1]);
    }
    return false;
  }

  /**
   * Check if a converted MDX value looks numeric (contains measures, math ops, numbers, or NULL).
   */
  private looksNumeric(mdxValue: string): boolean {
    // NULL is compatible with numeric
    if (mdxValue === "NULL") return true;
    // Contains measure reference
    if (mdxValue.includes("[Measures].")) return true;
    // Contains MDX functions that return numbers
    if (/\b(IIF|DIVIDE|Sum|Avg|Max|Min|Count)\s*\(/i.test(mdxValue)) return true;
    // Contains arithmetic operators (but not in strings)
    if (/[+\-*/]/.test(mdxValue) && !mdxValue.startsWith('"')) return true;
    // Is a number
    if (/^\d+(\.\d+)?$/.test(mdxValue.trim())) return true;
    return false;
  }
}
