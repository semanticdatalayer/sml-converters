import { DaxToken, FunctionToken } from "../dax-converter";
import { ConversionResult } from "../conversion-result";
import { ConversionContext } from "./conversion-context";

/**
 * Example of a DAX to MDX conversion
 */
export interface ConversionExample {
  /** DAX expression */
  dax: string;

  /** Expected MDX output */
  mdx: string;

  /** Optional description */
  description?: string;
}

/**
 * ConversionTemplate defines the interface for all DAX to MDX conversion templates.
 *
 * Templates implement pattern-based conversion for specific DAX constructs:
 * - DIVIDE function (2-arg and 3-arg)
 * - Time intelligence functions (DATESYTD, TOTALYTD, etc.)
 * - Aggregation patterns
 * - Custom business logic patterns
 *
 * Each template:
 * 1. Checks if it can convert the tokens (canConvert)
 * 2. Performs conversion if matched (convert)
 * 3. Returns confidence score (0.0-1.0)
 * 4. Provides examples for documentation
 *
 * Templates are registered in TemplateRegistry and matched by confidence (highest first).
 */
export abstract class ConversionTemplate {
  /**
   * Template name for logging and debugging
   */
  abstract readonly name: string;

  /**
   * Confidence score for this template (0.0-1.0)
   * - 1.0: Semantically equivalent conversion (DIVIDE 2-arg)
   * - 0.9-0.99: High confidence with minor semantic differences
   * - 0.8-0.89: Moderate confidence, may need manual review
   * - < 0.8: Low confidence, requires validation
   */
  abstract readonly confidence: number;

  /**
   * Check if this template can convert the given tokens
   * @param tokens - Tokenized DAX expression
   * @param context - Conversion context
   * @returns true if template can handle this pattern
   */
  abstract canConvert(
    tokens: DaxToken[],
    context: ConversionContext,
  ): boolean;

  /**
   * Convert DAX tokens to MDX expression
   * @param tokens - Tokenized DAX expression
   * @param context - Conversion context
   * @returns ConversionResult with MDX expression or error
   */
  abstract convert(
    tokens: DaxToken[],
    context: ConversionContext,
  ): ConversionResult;

  /**
   * Get examples of conversions this template performs
   * @returns Array of DAX/MDX example pairs
   */
  abstract getExamples(): ConversionExample[];

  /**
   * Get template description for documentation
   * @returns Human-readable description
   */
  abstract getDescription(): string;

  /**
   * Helper: Log template activity
   * @param message - Log message
   * @param context - Conversion context
   */
  protected log(message: string, context: ConversionContext): void {
    context.logger.debug(`[${this.name}] ${message}`);
  }

  /**
   * Helper: Log warning
   * @param message - Warning message
   * @param context - Conversion context
   */
  protected warn(message: string, context: ConversionContext): void {
    context.logger.warn(`[${this.name}] ${message}`);
  }

  /**
   * Helper: Check if tokens contain any unconvertible functions
   * Prevents templates from outputting invalid MDX with DAX-only functions
   *
   * @param tokens - Tokens to check
   * @param context - Conversion context
   * @returns true if tokens contain unconvertible functions
   */
  protected containsUnconvertibleFunctions(
    tokens: DaxToken[],
    context: ConversionContext,
  ): boolean {
    const { DirectFunctionConverter } = require("../converters/direct-function-converter");
    const converter = DirectFunctionConverter.getInstance(context.logger);

    for (const token of tokens) {
      if (token instanceof FunctionToken) {
        if (converter.isUnconvertibleFunction(token.functionAgg)) {
          return true;
        }
        // Recursively check nested arguments
        if (this.containsUnconvertibleFunctions(token.args, context)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Helper: Convert sub-expression using recursive template matching
   *
   * This enables templates to invoke other templates for nested expressions.
   * For example, CALCULATE can recursively convert nested IF, DIVIDE, etc.
   *
   * @param tokens - Tokenized sub-expression
   * @param context - Conversion context (includes templateRegistry)
   * @returns MDX string (from template if matched, otherwise from token.toMdx())
   */
  protected convertSubExpression(
    tokens: DaxToken[],
    context: ConversionContext,
  ): string {
    // Try template conversion first (recursive)
    const templateResult = context.templateRegistry.tryConvert(tokens, context);
    if (templateResult.success && templateResult.expression) {
      this.log(
        `Recursive template conversion succeeded for sub-expression: ${templateResult.expression}`,
        context,
      );
      return templateResult.expression;
    }

    // Fallback to direct token.toMdx() conversion
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
