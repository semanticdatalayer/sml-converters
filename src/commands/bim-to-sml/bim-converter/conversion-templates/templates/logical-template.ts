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
 * LogicalTemplate converts DAX logical functions to MDX infix operators.
 *
 * DAX uses function syntax: AND(a, b), OR(a, b), NOT(a)
 * MDX uses infix operators: a AND b, a OR b, NOT a
 *
 * Conversions:
 * - AND(a, b) → a AND b
 * - AND(a, b, c) → a AND b AND c
 * - OR(a, b) → a OR b
 * - OR(a, b, c) → a OR b OR c
 * - NOT(a) → NOT(a)
 *
 * Confidence: 1.0 (exact semantic equivalence)
 */
export class LogicalTemplate extends ConversionTemplate {
  readonly name = "LogicalTemplate";
  readonly confidence = 1.0;

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    // Must have exactly one token at root level
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];

    // Must be a function token
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    const funcName = token.functionAgg.toUpperCase();
    if (funcName !== "AND" && funcName !== "OR" && funcName !== "NOT") {
      return false;
    }

    // Validate argument count
    const argCount = this.countArguments(token.args);

    if (funcName === "NOT") {
      // NOT requires exactly 1 argument
      if (argCount !== 1) {
        this.warn(`NOT requires exactly 1 argument, got ${argCount}`, context);
        return false;
      }
    } else {
      // AND/OR require at least 2 arguments
      if (argCount < 2) {
        this.warn(`${funcName} requires at least 2 arguments, got ${argCount}`, context);
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
    const funcName = token.functionAgg.toUpperCase();
    const args = token.args;

    // Split arguments
    const argGroups = this.splitArguments(args);

    try {
      let mdxExpression: string;

      if (funcName === "NOT") {
        // NOT(a) → NOT(a) - may recursively invoke templates
        const argMdx = this.convertSubExpression(argGroups[0], context);
        mdxExpression = `NOT(${argMdx})`;
      } else {
        // AND/OR: convert arguments and join with operator - may recursively invoke templates
        const argMdxList = argGroups.map((group) =>
          this.convertSubExpression(group, context),
        );

        // AND(a, b, c) → (a) AND (b) AND (c)
        // OR(a, b, c) → (a) OR (b) OR (c)
        const operator = funcName; // "AND" or "OR"

        // Wrap each argument in parentheses for safety
        const wrappedArgs = argMdxList.map((arg) => `(${arg})`);
        mdxExpression = wrappedArgs.join(` ${operator} `);
      }

      return successfulConversion(
        mdxExpression,
        this.confidence,
        ConversionCategory.TEMPLATE_CONVERSION,
        {
          originalDax: `${funcName}(${argGroups.map((g) => this.convertSubExpression(g, context)).join(", ")})`,
          method: "logical_template",
          operator: funcName,
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
        dax: "AND([Sales] > 1000, [Profit] > 0)",
        mdx: "([Sales] > 1000) AND ([Profit] > 0)",
        description: "Logical AND with two conditions",
      },
      {
        dax: "OR([Status] = 'Active', [Status] = 'Pending')",
        mdx: "([Status] = 'Active') OR ([Status] = 'Pending')",
        description: "Logical OR with two conditions",
      },
      {
        dax: "NOT([IsDeleted])",
        mdx: "NOT([IsDeleted])",
        description: "Logical NOT",
      },
      {
        dax: "AND([A] = 1, [B] = 2, [C] = 3)",
        mdx: "([A] = 1) AND ([B] = 2) AND ([C] = 3)",
        description: "Logical AND with three conditions",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX logical functions (AND, OR, NOT) to MDX infix operators. " +
      "AND(a, b) becomes (a) AND (b), OR(a, b) becomes (a) OR (b), " +
      "NOT(a) becomes NOT(a). Supports multiple arguments for AND/OR."
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
