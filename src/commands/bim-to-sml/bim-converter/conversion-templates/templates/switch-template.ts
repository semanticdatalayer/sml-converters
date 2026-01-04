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
 * SwitchTemplate converts DAX SWITCH function to nested MDX IIF expressions.
 *
 * DAX: SWITCH(expression, value1, result1, value2, result2, ..., [default])
 * Compares expression against each value and returns corresponding result.
 * Optional default value if no match found.
 *
 * MDX equivalent (nested IIF):
 * SWITCH(x, 1, "a", 2, "b", "default")
 * → IIF(x=1, "a", IIF(x=2, "b", "default"))
 *
 * SWITCH(x, 1, "a", 2, "b")  (no default)
 * → IIF(x=1, "a", IIF(x=2, "b", NULL))
 *
 * Confidence: 0.95 (excellent pattern match)
 */
export class SwitchTemplate extends ConversionTemplate {
  readonly name = "SwitchTemplate";
  readonly confidence = 0.95;

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    // Must have exactly one token at root level
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];

    // Must be a SWITCH function
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    const funcName = token.functionAgg.toUpperCase();
    if (funcName !== "SWITCH") {
      return false;
    }

    // Validate argument structure
    // SWITCH requires: expression + at least one value/result pair (3 args minimum)
    // Can have: expression + pairs + optional default
    const argCount = this.countArguments(token.args);
    if (argCount < 3) {
      this.warn(
        `SWITCH function has ${argCount} arguments, expected at least 3 (expression + value + result)`,
        context,
      );
      return false;
    }

    return true;
  }

  convert(tokens: DaxToken[], context: ConversionContext): ConversionResult {
    const token = tokens[0] as FunctionToken;
    const args = token.args;

    // Split arguments
    const argGroups = this.splitArguments(args);

    if (argGroups.length < 3) {
      return failedConversion(
        `SWITCH requires at least 3 arguments (expression + value + result), got ${argGroups.length}`,
        token.functionAgg,
      );
    }

    try {
      // First argument is the expression to compare
      const exprMdx = this.convertSubExpression(argGroups[0], context);

      // Remaining arguments are value/result pairs, with optional default
      const pairCount = Math.floor((argGroups.length - 1) / 2);
      const hasDefault = (argGroups.length - 1) % 2 === 1;

      // Build nested IIF expressions from innermost to outermost
      let mdxExpression: string;

      if (hasDefault) {
        // Start with default value
        mdxExpression = this.convertSubExpression(
          argGroups[argGroups.length - 1],
          context,
        );
      } else {
        // No default, use NULL
        mdxExpression = "NULL";
      }

      // Build nested IIFs from last pair to first
      for (let i = pairCount - 1; i >= 0; i--) {
        const valueIdx = 1 + i * 2;
        const resultIdx = valueIdx + 1;

        const valueMdx = this.convertSubExpression(argGroups[valueIdx], context);
        const resultMdx = this.convertSubExpression(
          argGroups[resultIdx],
          context,
        );

        // IIF(expr = value, result, previousExpression)
        mdxExpression = `IIF(${exprMdx} = ${valueMdx}, ${resultMdx}, ${mdxExpression})`;
      }

      return successfulConversion(
        mdxExpression,
        this.confidence,
        ConversionCategory.TEMPLATE_CONVERSION,
        {
          originalDax: `SWITCH(${argGroups.map((g) => this.convertSubExpression(g, context)).join(", ")})`,
          method: "switch_template",
          pairCount,
          hasDefault,
        },
      );
    } catch (error) {
      return failedConversion(
        `Failed to convert SWITCH: ${error instanceof Error ? error.message : String(error)}`,
        token.functionAgg,
      );
    }
  }

  getExamples(): ConversionExample[] {
    return [
      {
        dax: "SWITCH([Status], 1, 'Active', 2, 'Inactive', 'Unknown')",
        mdx: "IIF([Status] = 1, 'Active', IIF([Status] = 2, 'Inactive', 'Unknown'))",
        description: "Multi-way conditional with default",
      },
      {
        dax: "SWITCH([Priority], 'High', 1, 'Medium', 2, 'Low', 3)",
        mdx: "IIF([Priority] = 'High', 1, IIF([Priority] = 'Medium', 2, IIF([Priority] = 'Low', 3, NULL)))",
        description: "String comparison without default",
      },
      {
        dax: "SWITCH([Month], 1, 'Jan', 2, 'Feb', 3, 'Mar', 'Other')",
        mdx: "IIF([Month] = 1, 'Jan', IIF([Month] = 2, 'Feb', IIF([Month] = 3, 'Mar', 'Other')))",
        description: "Month number to name conversion",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX SWITCH function to nested MDX IIF expressions. " +
      "SWITCH(expr, val1, res1, val2, res2, default) becomes " +
      "IIF(expr=val1, res1, IIF(expr=val2, res2, default)). " +
      "If no default provided, uses NULL."
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
