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
  ParenToken,
} from "../../dax-converter";
import {
  ConversionResult,
  ConversionCategory,
  successfulConversion,
  failedConversion,
} from "../../conversion-result";
import { ConversionContext } from "../conversion-context";

/**
 * InOperatorTemplate converts DAX IN and NOT IN operator patterns to MDX IIF chains.
 *
 * Handles patterns like:
 * - `column IN { "a", "b", "c" }` → `IIF(column = "a" OR column = "b" OR column = "c", 1, 0)`
 * - `NOT ( column IN { "a", "b" } )` → `IIF(column <> "a" AND column <> "b", 1, 0)`
 * - Single value: `col IN { "a" }` → `col = "a"` (simplified)
 * - Single NOT value: `NOT ( col IN { "a" } )` → `col <> "a"` (simplified)
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
    // Check for NOT IN pattern first: NOT ( col IN {...} )
    const notInPattern = this.detectNotInPattern(tokens);
    if (notInPattern) {
      // Validate the inner IN expression
      const innerTokens = notInPattern.innerTokens;
      const inIndex = this.findInOperatorIndex(innerTokens);
      if (inIndex === -1 || inIndex === 0 || inIndex === innerTokens.length - 1) {
        return false;
      }
      const rightTokens = innerTokens.slice(inIndex + 1);
      if (!rightTokens.some(t => t instanceof BraceToken)) {
        return false;
      }
      const leftTokens = innerTokens.slice(0, inIndex);
      if (this.containsUnconvertibleFunctions(leftTokens, context)) {
        this.warn("NOT IN left side contains unconvertible functions - rejecting", context);
        return false;
      }
      return true;
    }

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
    // Check for NOT IN pattern first
    const notInPattern = this.detectNotInPattern(tokens);
    if (notInPattern) {
      return this.convertNotIn(notInPattern.innerTokens, context);
    }

    // Regular IN conversion
    return this.convertIn(tokens, context, false);
  }

  /**
   * Convert NOT IN pattern to MDX with AND/<> chain
   */
  private convertNotIn(innerTokens: DaxToken[], context: ConversionContext): ConversionResult {
    return this.convertIn(innerTokens, context, true);
  }

  /**
   * Core conversion logic for IN/NOT IN patterns
   * @param isNegated - true for NOT IN, false for IN
   */
  private convertIn(tokens: DaxToken[], context: ConversionContext, isNegated: boolean): ConversionResult {
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

    // Determine operator and connector based on negation
    const operator = isNegated ? "<>" : "=";
    const connector = isNegated ? " AND " : " OR ";
    const methodSuffix = isNegated ? "not_in" : "in";

    // Single value: simplify to direct comparison
    if (extractionResult.values.length === 1) {
      const mdxExpression = `${leftExpr} ${operator} ${extractionResult.values[0]}`;
      return successfulConversion(
        mdxExpression,
        this.confidence,
        ConversionCategory.TEMPLATE_CONVERSION,
        {
          originalDax: context.daxExpression,
          method: `${methodSuffix}_operator_single_value`,
        },
      );
    }

    // Multi-value: create IIF with appropriate chain
    const conditions = extractionResult.values.map(val => `${leftExpr} ${operator} ${val}`);
    const chain = conditions.join(connector);
    const mdxExpression = `IIF(${chain}, 1, 0)`;

    return successfulConversion(
      mdxExpression,
      this.confidence,
      ConversionCategory.TEMPLATE_CONVERSION,
      {
        originalDax: context.daxExpression,
        method: `${methodSuffix}_operator_template`,
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
      {
        dax: 'NOT ( [Category] IN { "A", "B" } )',
        mdx: 'IIF([Category] <> "A" AND [Category] <> "B", 1, 0)',
        description: "NOT IN operator with multiple values",
      },
      {
        dax: 'NOT ( [Status] IN { "Inactive" } )',
        mdx: '[Status] <> "Inactive"',
        description: "Single value NOT IN simplified to inequality",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX IN and NOT IN operators to MDX IIF chains. " +
      "IN uses OR chains with =, NOT IN uses AND chains with <>. " +
      "Single-value sets are simplified to direct comparisons. " +
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

  /**
   * Detect NOT IN pattern: NOT ( col IN {...} )
   * Returns the inner tokens (col IN {...}) if pattern matches, null otherwise
   */
  private detectNotInPattern(tokens: DaxToken[]): { innerTokens: DaxToken[] } | null {
    // Pattern: NOT followed by ParenToken containing IN expression
    // tokens[0] = IdentifierToken("NOT"), tokens[1] = ParenToken containing IN expression
    if (tokens.length < 2) {
      return null;
    }

    const firstToken = tokens[0];
    if (!(firstToken instanceof IdentifierToken) || firstToken.value.toUpperCase() !== "NOT") {
      return null;
    }

    const secondToken = tokens[1];
    if (!(secondToken instanceof ParenToken)) {
      return null;
    }

    // Check that the ParenToken contains an IN operator
    const innerTokens = secondToken.args;
    const hasIn = this.findInOperatorIndex(innerTokens) !== -1;
    if (!hasIn) {
      return null;
    }

    return { innerTokens };
  }
}
