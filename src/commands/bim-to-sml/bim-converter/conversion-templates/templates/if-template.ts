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
 * IfTemplate converts DAX IF/IIF functions to MDX IIF.
 *
 * DAX IF and IIF are functionally identical:
 * - IF(logical_test, value_if_true, value_if_false)
 * - IIF(logical_test, value_if_true, value_if_false)
 *
 * Both map directly to MDX IIF:
 * → IIF(logical_test, value_if_true, value_if_false)
 *
 * Confidence: 1.0 (exact semantic match)
 */
export class IfTemplate extends ConversionTemplate {
  readonly name = "IfTemplate";
  readonly confidence = 1.0;

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    // Must have exactly one token at root level
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];

    // Must be an IF or IIF function
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    const funcName = token.functionAgg.toUpperCase();
    if (funcName !== "IF" && funcName !== "IIF") {
      return false;
    }

    // Validate argument structure - requires exactly 3 arguments
    const argCount = this.countArguments(token.args);
    if (argCount !== 3) {
      this.warn(
        `${funcName} function has ${argCount} arguments, expected 3`,
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

    // Find argument boundaries (split by commas)
    const argGroups = this.splitArguments(args);

    if (argGroups.length !== 3) {
      return failedConversion(
        `${funcName} requires exactly 3 arguments, got ${argGroups.length}`,
        token.functionAgg,
      );
    }

    try {
      // Convert argument tokens to MDX
      const conditionMdx = this.convertArgumentGroup(argGroups[0], context);
      const trueValueMdx = this.convertArgumentGroup(argGroups[1], context);
      const falseValueMdx = this.convertArgumentGroup(argGroups[2], context);

      // DAX IF/IIF → MDX IIF (direct mapping)
      const mdxExpression = `IIF(${conditionMdx}, ${trueValueMdx}, ${falseValueMdx})`;

      return successfulConversion(
        mdxExpression,
        this.confidence,
        ConversionCategory.TEMPLATE_CONVERSION,
        {
          originalDax: `${funcName}(${conditionMdx}, ${trueValueMdx}, ${falseValueMdx})`,
          method: "if_template",
        },
      );
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
        dax: "IF([Sales] > 1000, 'High', 'Low')",
        mdx: "IIF([Sales] > 1000, 'High', 'Low')",
        description: "Simple conditional with string literals",
      },
      {
        dax: "IIF([Profit] < 0, 0, [Profit])",
        mdx: "IIF([Profit] < 0, 0, [Profit])",
        description: "IIF form - clamp negative values to zero",
      },
      {
        dax: "IF([Quantity] = 0, BLANK(), [Revenue] / [Quantity])",
        mdx: "IIF([Quantity] = 0, BLANK(), [Revenue] / [Quantity])",
        description: "Conditional to avoid division by zero",
      },
      {
        dax: "IF([Status] = 'Active', [CurrentValue], 0)",
        mdx: "IIF([Status] = 'Active', [CurrentValue], 0)",
        description: "Conditional based on text comparison",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX IF/IIF functions to MDX IIF. " +
      "Direct 1:1 mapping as both DAX IF and IIF have identical syntax to MDX IIF."
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
   * Convert an argument group (tokens) to MDX string
   */
  private convertArgumentGroup(
    tokens: DaxToken[],
    context: ConversionContext,
  ): string {
    // Build info object for token.toMdx()
    const info = {
      bim: context.bim,
      expr: context.daxExpression,
      tableName: context.tableName,
      result: context.result,
      attrMaps: context.attrMaps,
      unusedTables: context.unusedTables,
      measureConverter: context.measureConverter,
    };

    return tokens.map((token) => token.toMdx(info)).join("");
  }
}
