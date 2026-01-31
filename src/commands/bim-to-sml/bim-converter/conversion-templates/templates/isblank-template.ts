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

/**
 * IsBlankTemplate converts DAX ISBLANK and BLANK functions.
 *
 * Handles two forms:
 * 1. ISBLANK(value) - Tests if value is blank/null
 *    → ISEMPTY(value)
 *    Confidence: 0.95 (semantically equivalent, minor edge cases)
 *    Note: Using ISEMPTY() instead of "value IS NULL" because IS NULL
 *    is not valid for function results in AtScale MDX.
 *
 * 2. BLANK() - Returns a blank/null value
 *    → NULL
 *    Confidence: 1.0 (exact match)
 *
 * Note: DAX BLANK includes both NULL and empty string concepts.
 * MDX NULL is the closest equivalent.
 */
export class IsBlankTemplate extends ConversionTemplate {
  readonly name = "IsBlankTemplate";
  readonly confidence = 0.95;

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    // Must have exactly one token at root level
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];

    // Must be an ISBLANK or BLANK function
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    const funcName = token.functionAgg.toUpperCase();
    if (funcName !== "ISBLANK" && funcName !== "BLANK") {
      return false;
    }

    // Validate argument structure
    const argCount = this.countArguments(token.args);

    if (funcName === "ISBLANK") {
      // ISBLANK requires exactly 1 argument
      if (argCount !== 1) {
        this.warn(
          `ISBLANK function has ${argCount} arguments, expected 1`,
          context,
        );
        return false;
      }
    } else if (funcName === "BLANK") {
      // BLANK requires 0 arguments
      if (argCount !== 0) {
        this.warn(
          `BLANK function has ${argCount} arguments, expected 0`,
          context,
        );
        return false;
      }
    }

    // CRITICAL: Reject if arguments contain unconvertible functions
    if (this.containsUnconvertibleFunctions(token.args, context)) {
      this.warn(
        `${funcName} arguments contain unconvertible functions - rejecting conversion`,
        context,
      );
      return false;
    }

    return true;
  }

  convert(tokens: DaxToken[], context: ConversionContext): ConversionResult {
    const token = tokens[0] as FunctionToken;
    const args = token.args;
    const funcName = token.functionAgg.toUpperCase();

    try {
      if (funcName === "BLANK") {
        // BLANK() → NULL
        return successfulConversion(
          "NULL",
          1.0, // Perfect match
          ConversionCategory.TEMPLATE_CONVERSION,
          {
            originalDax: "BLANK()",
            method: "blank_template",
          },
        );
      } else {
        // ISBLANK(value) → ISEMPTY(value)
        // Note: Using ISEMPTY() instead of "value IS NULL" because IS NULL
        // is not valid for function results in AtScale MDX (e.g., Year([Measure]) IS NULL is invalid)
        const argGroups = this.splitArguments(args);

        if (argGroups.length !== 1) {
          return failedConversion(
            `ISBLANK requires exactly 1 argument, got ${argGroups.length}`,
            token.functionAgg,
          );
        }

        const valueMdx = this.convertSubExpression(argGroups[0], context);
        const mdxExpression = `ISEMPTY(${valueMdx})`;

        return successfulConversion(
          mdxExpression,
          this.confidence,
          ConversionCategory.TEMPLATE_CONVERSION,
          {
            originalDax: `ISBLANK(${valueMdx})`,
            method: "isblank_template",
          },
        );
      }
    } catch (error) {
      return failedConversion(
        `Failed to convert ${funcName}: ${error instanceof Error ? error.message : String(error)}`,
        token.functionAgg,
      );
    }
  }

  getExamples(): ConversionExample[] {
    return [
      {
        dax: "ISBLANK([Customer])",
        mdx: "ISEMPTY([Customer])",
        description: "Check if customer field is blank",
      },
      {
        dax: "ISBLANK([SalesAmount])",
        mdx: "ISEMPTY([SalesAmount])",
        description: "Check if sales amount is null",
      },
      {
        dax: "BLANK()",
        mdx: "NULL",
        description: "Return a blank/null value",
      },
      {
        dax: "IF(ISBLANK([Discount]), 0, [Discount])",
        mdx: "IIF(ISEMPTY([Discount]), 0, [Discount])",
        description: "Replace blank discount with zero",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX ISBLANK/BLANK functions to MDX operations. " +
      "ISBLANK(value) becomes 'ISEMPTY(value)'. " +
      "BLANK() becomes 'NULL'."
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
}
