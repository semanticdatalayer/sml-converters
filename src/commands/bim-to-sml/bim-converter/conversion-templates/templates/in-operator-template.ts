import {
  ConversionTemplate,
  ConversionExample,
} from "../template-base";
import {
  DaxToken,
  OperatorToken,
  BraceToken,
  LiteralToken,
  CommaToken,
  IdentifierToken,
  TableColumnReference,
  ColumnReference,
} from "../../dax-converter";
import {
  ConversionResult,
  ConversionCategory,
  successfulConversion,
  failedConversion,
} from "../../conversion-result";
import { ConversionContext } from "../conversion-context";

/**
 * InOperatorTemplate converts DAX IN operator patterns to MDX IIF/OR chains.
 *
 * Handles patterns like:
 * - `column IN { "a", "b", "c" }` → `IIF(column = "a" OR column = "b" OR column = "c", 1, 0)`
 * - Single value: `col IN { "a" }` → `col = "a"` (simplified)
 *
 * Edge cases handled as TODO:
 * - Empty sets: `col IN {}` → TODO
 * - Non-literal values in set: `col IN { [OtherCol], "a" }` → TODO
 *
 * Confidence: 0.95
 */
export class InOperatorTemplate extends ConversionTemplate {
  readonly name = "InOperatorTemplate";
  readonly confidence = 0.95;

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    // Find an IN operator (case-insensitive)
    const inIndex = this.findInOperatorIndex(tokens);
    if (inIndex === -1) {
      return false;
    }

    // Must have tokens on both sides
    if (inIndex === 0 || inIndex === tokens.length - 1) {
      return false;
    }

    // Right side must contain a BraceToken
    const rightTokens = tokens.slice(inIndex + 1);
    const hasBraceToken = rightTokens.some(t => t instanceof BraceToken);
    if (!hasBraceToken) {
      return false;
    }

    // CRITICAL: Reject if left side contains unconvertible functions
    const leftTokens = tokens.slice(0, inIndex);
    if (this.containsUnconvertibleFunctions(leftTokens, context)) {
      this.warn(
        "IN operator left side contains unconvertible functions - rejecting",
        context,
      );
      return false;
    }

    return true;
  }

  convert(tokens: DaxToken[], context: ConversionContext): ConversionResult {
    const inIndex = this.findInOperatorIndex(tokens);
    if (inIndex === -1) {
      return failedConversion("IN operator not found", context.daxExpression);
    }

    // Left side: expression before IN
    const leftTokens = tokens.slice(0, inIndex);
    const leftExpr = this.convertSubExpression(leftTokens, context);

    // Right side: extract BraceToken with values
    const rightTokens = tokens.slice(inIndex + 1);
    const braceToken = rightTokens.find(t => t instanceof BraceToken) as BraceToken | undefined;

    if (!braceToken) {
      return failedConversion("No brace token found after IN", context.daxExpression);
    }

    // Extract values from BraceToken
    const extractionResult = this.extractValues(braceToken);

    // Handle edge cases
    if (extractionResult.hasNonLiteral) {
      return failedConversion(
        "TODO: IN operator with non-literal values not supported",
        context.daxExpression,
      );
    }

    if (extractionResult.values.length === 0) {
      return failedConversion(
        "TODO: Empty IN set not supported",
        context.daxExpression,
      );
    }

    // Single value: simplify to equality
    if (extractionResult.values.length === 1) {
      const mdxExpression = `${leftExpr} = ${extractionResult.values[0]}`;
      return successfulConversion(
        mdxExpression,
        this.confidence,
        ConversionCategory.TEMPLATE_CONVERSION,
        {
          originalDax: context.daxExpression,
          method: "in_operator_single_value",
        },
      );
    }

    // Multi-value: create IIF with OR chain
    const orConditions = extractionResult.values.map(val => `${leftExpr} = ${val}`);
    const orChain = orConditions.join(" OR ");
    const mdxExpression = `IIF(${orChain}, 1, 0)`;

    return successfulConversion(
      mdxExpression,
      this.confidence,
      ConversionCategory.TEMPLATE_CONVERSION,
      {
        originalDax: context.daxExpression,
        method: "in_operator_template",
        valueCount: extractionResult.values.length,
      },
    );
  }

  getExamples(): ConversionExample[] {
    return [
      {
        dax: '[Category] IN { "A", "B", "C" }',
        mdx: 'IIF([Category] = "A" OR [Category] = "B" OR [Category] = "C", 1, 0)',
        description: "IN operator with multiple string values",
      },
      {
        dax: '[Status] IN { "Active" }',
        mdx: '[Status] = "Active"',
        description: "Single value IN simplified to equality",
      },
      {
        dax: "[Year] IN { 2023, 2024 }",
        mdx: "IIF([Year] = 2023 OR [Year] = 2024, 1, 0)",
        description: "IN operator with numeric values",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX IN operator to MDX IIF/OR chains. " +
      "Single-value sets are simplified to direct equality. " +
      "Empty sets and non-literal values result in TODO markers."
    );
  }

  /**
   * Find the index of an IN operator token (case-insensitive)
   */
  private findInOperatorIndex(tokens: DaxToken[]): number {
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token instanceof OperatorToken && token.value.toUpperCase() === "IN") {
        return i;
      }
      // Also check IdentifierToken as IN might be parsed as identifier
      if (token instanceof IdentifierToken && token.value.toUpperCase() === "IN") {
        return i;
      }
    }
    return -1;
  }

  /**
   * Extract literal values from a BraceToken
   * @returns Object with values array and hasNonLiteral flag
   */
  private extractValues(braceToken: BraceToken): { values: string[]; hasNonLiteral: boolean } {
    const values: string[] = [];
    let hasNonLiteral = false;

    for (const arg of braceToken.args) {
      if (arg instanceof CommaToken) {
        // Skip commas
        continue;
      }

      if (arg instanceof LiteralToken) {
        // String and numeric literals
        values.push(arg.value);
      } else if (arg instanceof IdentifierToken) {
        // Could be a bare identifier like TRUE/FALSE or an unquoted string
        // Check if it looks like a variable/column reference
        const upperVal = arg.value.toUpperCase();
        if (upperVal === "TRUE" || upperVal === "FALSE") {
          values.push(arg.value);
        } else {
          // Treat as non-literal (potential variable/column reference)
          hasNonLiteral = true;
        }
      } else if (arg instanceof TableColumnReference || arg instanceof ColumnReference) {
        // Column references are non-literal
        hasNonLiteral = true;
      } else {
        // Other token types are non-literal
        hasNonLiteral = true;
      }
    }

    return { values, hasNonLiteral };
  }
}
