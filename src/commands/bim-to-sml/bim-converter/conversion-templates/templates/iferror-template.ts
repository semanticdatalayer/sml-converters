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
 * IfErrorTemplate converts DAX IFERROR function to MDX error handling.
 *
 * DAX: IFERROR(value, value_if_error)
 * Returns value if no error, otherwise returns value_if_error
 *
 * MDX equivalent (using IIF + IsError if available):
 * → IIF(IsError(value), value_if_error, value)
 *
 * Note: IsError function availability depends on MDX implementation.
 * Some environments may need alternative error handling approaches.
 *
 * Confidence: 0.85 (good match where IsError is available)
 */
export class IfErrorTemplate extends ConversionTemplate {
  readonly name = "IfErrorTemplate";
  readonly confidence = 0.85;

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

    // Validate argument structure - requires exactly 2 arguments
    const argCount = this.countArguments(token.args);
    if (argCount !== 2) {
      this.warn(
        `IFERROR function has ${argCount} arguments, expected 2`,
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
      const fallbackMdx = this.convertSubExpression(argGroups[1], context);

      // IFERROR(value, fallback) → IIF(IsError(value), fallback, value)
      // Note: This checks the error condition BEFORE evaluating value
      // to avoid propagating the error
      const mdxExpression = `IIF(IsError(${valueMdx}), ${fallbackMdx}, ${valueMdx})`;

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
        dax: "IFERROR([Sales] / [Quantity], 0)",
        mdx: "IIF(IsError([Sales] / [Quantity]), 0, [Sales] / [Quantity])",
        description: "Return 0 if division fails",
      },
      {
        dax: "IFERROR([LookupValue], 'Not Found')",
        mdx: "IIF(IsError([LookupValue]), 'Not Found', [LookupValue])",
        description: "Return 'Not Found' if lookup fails",
      },
      {
        dax: "IFERROR([ComplexCalculation], BLANK())",
        mdx: "IIF(IsError([ComplexCalculation]), NULL, [ComplexCalculation])",
        description: "Return NULL if calculation fails",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX IFERROR function to MDX error handling using IIF + IsError. " +
      "IFERROR(value, fallback) becomes IIF(IsError(value), fallback, value). " +
      "Note: Requires IsError function support in the MDX environment."
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
