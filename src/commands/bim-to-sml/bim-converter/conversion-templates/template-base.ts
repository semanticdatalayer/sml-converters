import { DaxToken } from "../dax-converter";
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
}
