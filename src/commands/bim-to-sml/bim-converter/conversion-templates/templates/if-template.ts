import {
  ConversionTemplate,
  ConversionExample,
} from "../template-base";
import { DaxToken, FunctionToken, CommaToken, StringLiteralToken } from "../../dax-converter";
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

    // Validate argument structure - requires 2 or 3 arguments
    // 2 args: IF(condition, true_value) - false_value defaults to BLANK()
    // 3 args: IF(condition, true_value, false_value)
    const argCount = this.countArguments(token.args);
    if (argCount < 2 || argCount > 3) {
      this.warn(
        `${funcName} function has ${argCount} arguments, expected 2 or 3`,
        context,
      );
      return false;
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

    // Find argument boundaries (split by commas)
    const argGroups = this.splitArguments(args);

    if (argGroups.length < 2 || argGroups.length > 3) {
      return failedConversion(
        `${funcName} requires 2 or 3 arguments, got ${argGroups.length}`,
        token.functionAgg,
      );
    }

    // CRITICAL: Check that arguments don't contain unconvertible functions
    // This prevents outputting invalid MDX like "IIF(CALCULATE(...), ...)"
    for (let i = 0; i < argGroups.length; i++) {
      if (this.containsUnconvertibleFunctions(argGroups[i], context)) {
        return failedConversion(
          `${funcName} argument ${i} contains unconvertible functions - cannot convert to valid MDX`,
          token.functionAgg,
        );
      }
    }

    try {
      // Convert argument tokens to MDX - may recursively invoke templates
      const conditionMdx = this.convertSubExpression(argGroups[0], context);
      let trueValueMdx = this.convertSubExpression(argGroups[1], context);

      // DAX IF supports 2 or 3 arguments
      // If only 2 args, false value defaults to NULL
      let falseValueMdx = argGroups.length === 3
        ? this.convertSubExpression(argGroups[2], context)
        : "NULL";

      // CRITICAL: AtScale IIF requires both branches to have the same type.
      // DAX allows mixed types (e.g., "N/A" vs numeric), but MDX does not.
      // Convert string placeholders like "N/A" to NULL when the other branch is numeric.
      const trueIsNullPlaceholder = this.isNullPlaceholderString(trueValueMdx);
      const falseIsNullPlaceholder = this.isNullPlaceholderString(falseValueMdx);
      const trueIsNumeric = this.looksNumeric(trueValueMdx);
      const falseIsNumeric = this.looksNumeric(falseValueMdx);

      if (trueIsNullPlaceholder && falseIsNumeric) {
        trueValueMdx = "NULL";
      }
      if (falseIsNullPlaceholder && trueIsNumeric) {
        falseValueMdx = "NULL";
      }

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
   * Used to determine if the other IF branch should have its string placeholder converted to NULL.
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

  /**
   * Transform N/A placeholder equality comparisons to ISEMPTY() checks.
   *
   * DAX commonly uses patterns like `[Measure] = "N/A"` to check if a measure
   * returned a null placeholder. In MDX, we should use `ISEMPTY([Measures].[Measure])`
   * instead to avoid type mismatch errors.
   *
   * Handles both orderings:
   * - `[Measures].[X] = "N/A"` → `ISEMPTY([Measures].[X])`
   * - `"N/A" = [Measures].[X]` → `ISEMPTY([Measures].[X])`
   *
   * @param conditionMdx The converted MDX condition string
   * @returns Transformed condition if pattern matched, otherwise original condition
   */
  transformNullPlaceholderComparison(conditionMdx: string): string {
    // Build regex pattern for null placeholder strings
    // Escape special regex chars and join with |
    const placeholderPattern = Array.from(NULL_PLACEHOLDER_STRINGS)
      .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');

    // Pattern 1: <expr> = "placeholder"
    // Match: anything that's not whitespace/= followed by optional spaces, =, optional spaces, quoted placeholder
    const pattern1 = new RegExp(`^(.+?)\\s*=\\s*"(${placeholderPattern})"$`);

    // Pattern 2: "placeholder" = <expr>
    const pattern2 = new RegExp(`^"(${placeholderPattern})"\\s*=\\s*(.+)$`);

    let match = conditionMdx.match(pattern1);
    if (match) {
      const expr = match[1].trim();
      return `ISEMPTY(${expr})`;
    }

    match = conditionMdx.match(pattern2);
    if (match) {
      const expr = match[2].trim();
      return `ISEMPTY(${expr})`;
    }

    return conditionMdx;
  }
}
