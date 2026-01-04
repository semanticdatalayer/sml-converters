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
 * DivideTemplate converts DAX DIVIDE function to MDX division.
 *
 * Handles two forms:
 * 1. DIVIDE(numerator, denominator)
 *    → (numerator) / (denominator)
 *    Confidence: 1.0 (semantically equivalent)
 *
 * 2. DIVIDE(numerator, denominator, alternate_result)
 *    → IIF(denominator = 0, alternate_result, (numerator) / (denominator))
 *    Confidence: 1.0 (semantically equivalent)
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

      if (argGroups.length === 2) {
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
}
