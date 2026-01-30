import { DaxTokenizer, DaxToken, FunctionToken, CommaToken, OperatorToken, LiteralToken } from "./dax-converter";
import { DaxExpression } from "./dax-expression";
import {
  ConversionResult,
  ConversionCategory,
  successfulConversion,
  failedConversion,
} from "./conversion-result";
import { DirectFunctionConverter } from "./converters/direct-function-converter";
import { TemplateRegistry } from "./conversion-templates/template-registry";
import { ConversionContext } from "./conversion-templates/conversion-context";
import { VarInliner } from "./var-analysis/var-inliner";
import { Logger } from "../../../shared/logger";
import { escapeForComment, isBooleanReturningExpression } from "./tools";

/**
 * Configuration for conversion pipeline
 */
export interface PipelineConfig {
  /** Minimum confidence for AI conversion (0.0-1.0, default: 0.3) */
  aiMinConfidence: number;

  /** Whether AI conversion is enabled (requires --llmName flag) */
  aiEnabled: boolean;

  /** LLM name for AI conversion (e.g., "openai", "anthropic") */
  llmName?: string;
}

/**
 * Default pipeline configuration (per user preferences)
 */
export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  aiMinConfidence: 0.3,
  aiEnabled: false,
};

/**
 * Result from pipeline conversion with detailed metadata
 */
export interface PipelineResult extends ConversionResult {
  /** Which stage succeeded (1-5) */
  stage?: number;

  /** Stage name */
  stageName?: string;

  /** Whether VARs were inlined before conversion */
  varsInlined?: boolean;

  /** Number of VARs inlined */
  varsInlinedCount?: number;
}

/**
 * ConversionPipeline orchestrates the 6-stage DAX to MDX conversion process.
 *
 * Pipeline stages:
 * 1. Direct conversion - Simple 1:1 DAX→MDX function mappings (conf: 1.0)
 * 2. Simple expression - Math expressions with no unconvertible functions (conf: 1.0)
 * 3. Template conversion - Pattern-based conversion (DIVIDE, etc.) (conf: 0.9-1.0)
 * 4. VAR inline + retry - Inline safe VARs, retry stages 1-3 (conf: varies)
 * 5. AI conversion - LLM-powered conversion (conf: 0.0-0.7)
 * 6. Fallback TODO - Placeholder with original DAX (conf: 0.0)
 *
 * Usage:
 * ```typescript
 * const pipeline = new ConversionPipeline(logger, config);
 * const result = await pipeline.convert(daxExpression, context);
 * ```
 */
export class ConversionPipeline {
  private directConverter: DirectFunctionConverter;
  private templateRegistry: TemplateRegistry;
  private varInliner: VarInliner;
  private config: PipelineConfig;

  constructor(
    private logger: Logger,
    config?: Partial<PipelineConfig>,
  ) {
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };
    this.directConverter = DirectFunctionConverter.getInstance(logger);
    this.templateRegistry = TemplateRegistry.getInstance(logger);
    this.varInliner = new VarInliner(logger);
  }

  /**
   * Get the template registry instance for use in conversion context
   */
  public getTemplateRegistry(): TemplateRegistry {
    return this.templateRegistry;
  }

  /**
   * Convert DAX expression through 5-stage pipeline
   * @param daxExpression - DAX expression string
   * @param context - Conversion context
   * @returns PipelineResult with MDX expression or fallback
   */
  public async convert(
    daxExpression: string,
    context: ConversionContext,
  ): Promise<PipelineResult> {
    this.logger.debug(`Pipeline converting: ${daxExpression}`);

    // Tokenize expression
    const tokenizer = new DaxTokenizer();
    const tokens = tokenizer.tokenize(daxExpression);

    // Check if expression contains VARs - if so, skip Stages 1-3 and go to Stage 4
    // This prevents all stages from converting expressions with VAR references that aren't inlined
    const hasVars = this.expressionHasVars(daxExpression);
    if (hasVars) {
      this.logger.debug("Expression contains VARs, skipping Stages 1-3 and proceeding to Stage 4 (VAR inline)");
    } else {
      // Stage 1: Direct conversion
      const stage1Result = this.tryDirectConversion(tokens, context);
      if (stage1Result.success && stage1Result.confidence >= 0.95) {
        this.logger.debug(`Stage 1 (Direct) succeeded: ${stage1Result.expression}`);
        return {
          ...stage1Result,
          stage: 1,
          stageName: "direct_conversion",
        };
      }

      // Stage 2: Simple expression conversion
      const stage2Result = this.trySimpleExpression(daxExpression, tokens, context);
      if (stage2Result.success) {
        this.logger.debug(`Stage 2 (Simple) succeeded: ${stage2Result.expression}`);
        return {
          ...stage2Result,
          stage: 2,
          stageName: "simple_expression",
        };
      }

      // Stage 3: Template conversion
      const stage3Result = this.tryTemplateConversion(tokens, context);
      if (stage3Result.success && stage3Result.confidence >= 0.85) {
        this.logger.debug(`Stage 3 (Template) succeeded: ${stage3Result.expression}`);
        return {
          ...stage3Result,
          stage: 3,
          stageName: "template_conversion",
        };
      }
    }

    // Stage 4: VAR inline + retry
    const stage4Result = await this.tryVarInlineAndRetry(
      daxExpression,
      tokens,
      context,
    );
    if (stage4Result.success) {
      this.logger.debug(
        `Stage 4 (VAR inline) succeeded: ${stage4Result.expression}`,
      );
      return stage4Result;
    }

    // Stage 5: AI conversion (if enabled)
    if (this.config.aiEnabled && this.config.llmName) {
      const stage5Result = await this.tryAiConversion(
        daxExpression,
        tokens,
        context,
      );
      if (stage5Result.success && stage5Result.confidence >= this.config.aiMinConfidence) {
        this.logger.debug(`Stage 5 (AI) succeeded: ${stage5Result.expression}`);
        return {
          ...stage5Result,
          stage: 5,
          stageName: "ai_conversion",
        };
      }
    }

    // Stage 6: Fallback TODO
    this.logger.debug("All stages failed, creating fallback TODO");
    return this.createFallback(daxExpression);
  }

  // DAX aggregate functions that should pass their aggregation type to child column references
  private static readonly AGGREGATE_FUNCTIONS = new Set([
    "SUM", "MIN", "MAX", "AVG", "AVERAGE", "COUNT", "DISTINCTCOUNT"
  ]);

  /**
   * Stage 1: Try direct function conversion
   */
  private tryDirectConversion(
    tokens: DaxToken[],
    context: ConversionContext,
  ): ConversionResult {
    // Direct conversion only works for single function tokens
    if (tokens.length !== 1) {
      return failedConversion(
        "Direct conversion requires single function token",
        "",
      );
    }

    const token = tokens[0];
    if (!(token instanceof FunctionToken)) {
      return failedConversion("Direct conversion requires function token", "");
    }

    // For aggregate functions (SUM, COUNT, etc.), pass the function name so that
    // TableColumnReference can create metrics with the correct aggregation type
    const funcName = token.functionAgg.trim().toUpperCase();

    // Skip complex pattern functions (TOTALYTD, CALCULATE, etc.) - these have templates
    // and should not have their arguments converted in Stage 1 as some arguments
    // (like dimension column references) are handled specially by templates
    if (this.directConverter.isComplexPattern(funcName)) {
      return failedConversion(
        `Function ${funcName} requires template conversion`,
        funcName,
      );
    }
    const parentAggFn = ConversionPipeline.AGGREGATE_FUNCTIONS.has(funcName)
      ? funcName
      : undefined;

    // Convert arguments first (recursively)
    const args = this.convertTokensToMdx(token.args, context, parentAggFn);

    // Try direct conversion
    return this.directConverter.tryConvert(token, args);
  }

  /**
   * Stage 2: Try simple expression conversion (no unconvertible functions)
   *
   * Handles expressions like:
   * - [Sales] / [Units]
   * - [Revenue] - [Cost]
   * - ([A] + [B]) * [C]
   *
   * These contain only convertible functions (SUM, MAX, etc.) and math operators,
   * but aren't single function calls so they fail direct conversion.
   */
  private trySimpleExpression(
    daxExpression: string,
    tokens: DaxToken[],
    context: ConversionContext,
  ): ConversionResult {
    // Check if expression contains unconvertible functions
    const tokenizer = new DaxTokenizer();
    tokenizer.tokenize(daxExpression);

    if (tokenizer.hasUnconvertibleFunctions(this.logger)) {
      return failedConversion(
        "Contains unconvertible functions (CALCULATE, FILTER, etc.)",
        daxExpression,
      );
    }

    // Check if expression contains complex pattern functions that need template handling
    // (DIVIDE, IF, etc. - functions that have templates but aren't simple direct conversions)
    const categories = tokenizer.categorizeFunctions(this.logger);
    if (categories.complex.length > 0) {
      return failedConversion(
        `Contains complex pattern functions (${categories.complex.join(", ")}) - needs template conversion`,
        daxExpression,
      );
    }


    // Expression is "simple" - just convert all tokens to MDX
    try {
      const mdxParts = this.convertTokensToMdx(tokens, context);
      const mdxExpression = mdxParts.join("");

      return successfulConversion(
        mdxExpression,
        1.0,
        ConversionCategory.TEMPLATE_CONVERSION, // Use TEMPLATE_CONVERSION category
        {
          originalDax: daxExpression,
          method: "simple_expression",
          note: "Simple math expression with no unconvertible functions",
        },
      );
    } catch (error) {
      return failedConversion(
        `Simple expression conversion failed: ${error instanceof Error ? error.message : String(error)}`,
        daxExpression,
      );
    }
  }

  /**
   * Stage 3: Try template-based conversion
   */
  private tryTemplateConversion(
    tokens: DaxToken[],
    context: ConversionContext,
  ): ConversionResult {
    return this.templateRegistry.tryConvert(tokens, context);
  }

  /**
   * Stage 4: Try VAR inlining + retry stages 1-3
   */
  private async tryVarInlineAndRetry(
    daxExpression: string,
    tokens: DaxToken[],
    context: ConversionContext,
  ): Promise<PipelineResult> {
    // Parse as DaxExpression to check for VARs
    let expression: DaxExpression;
    try {
      expression = DaxExpression.parse(daxExpression);
    } catch (error) {
      return {
        ...failedConversion(`Failed to parse expression: ${error}`, daxExpression),
        stage: 4,
        stageName: "var_inline_retry",
      };
    }

    // If no VARs, skip this stage
    if (!expression.hasVariables()) {
      return {
        ...failedConversion("No VARs to inline", daxExpression),
        stage: 4,
        stageName: "var_inline_retry",
      };
    }

    // Try to inline VARs
    const inliningResult = this.varInliner.inline(expression);

    if (!inliningResult.modified) {
      this.logger.debug("VAR inlining: no VARs were safe to inline");
      return {
        ...failedConversion("No safe VARs to inline", daxExpression),
        stage: 4,
        stageName: "var_inline_retry",
      };
    }

    this.logger.debug(
      `VAR inlining: ${inliningResult.inlinedCount} VARs inlined, ${inliningResult.remainingCount} remaining`,
    );

    // If VARs remain after inlining, don't retry stages - fall through to TODO
    // Retrying with remaining VAR references produces invalid MDX
    if (inliningResult.remainingCount > 0) {
      this.logger.debug(
        `${inliningResult.remainingCount} VARs could not be inlined - skipping retries, will use TODO fallback`,
      );
      return {
        ...failedConversion(
          `${inliningResult.remainingCount} VARs could not be inlined (used in unconvertible contexts)`,
          daxExpression,
        ),
        stage: 4,
        stageName: "var_inline_retry",
        varsInlined: true,
        varsInlinedCount: inliningResult.inlinedCount,
      };
    }

    // All VARs were inlined - retry stage 1: Direct conversion
    const stage1Retry = this.tryDirectConversion(
      inliningResult.tokens,
      context,
    );
    if (stage1Retry.success && stage1Retry.confidence >= 0.95) {
      return {
        ...stage1Retry,
        stage: 4,
        stageName: "var_inline_retry",
        category: ConversionCategory.VAR_INLINED,
        varsInlined: true,
        varsInlinedCount: inliningResult.inlinedCount,
        metadata: {
          ...stage1Retry.metadata,
          varsInlined: inliningResult.inlinedCount,
          varsRemaining: inliningResult.remainingCount,
          retryStage: "direct",
        },
      };
    }

    // Retry stage 2: Simple expression
    const stage2Retry = this.trySimpleExpression(
      daxExpression,
      inliningResult.tokens,
      context,
    );
    if (stage2Retry.success) {
      return {
        ...stage2Retry,
        stage: 4,
        stageName: "var_inline_retry",
        category: ConversionCategory.VAR_INLINED,
        varsInlined: true,
        varsInlinedCount: inliningResult.inlinedCount,
        metadata: {
          ...stage2Retry.metadata,
          varsInlined: inliningResult.inlinedCount,
          varsRemaining: inliningResult.remainingCount,
          retryStage: "simple_expression",
        },
      };
    }

    // Retry stage 3: Template conversion
    const stage3Retry = this.tryTemplateConversion(
      inliningResult.tokens,
      context,
    );
    if (stage3Retry.success && stage3Retry.confidence >= 0.85) {
      return {
        ...stage3Retry,
        stage: 4,
        stageName: "var_inline_retry",
        category: ConversionCategory.VAR_INLINED,
        varsInlined: true,
        varsInlinedCount: inliningResult.inlinedCount,
        metadata: {
          ...stage3Retry.metadata,
          varsInlined: inliningResult.inlinedCount,
          varsRemaining: inliningResult.remainingCount,
          retryStage: "template",
        },
      };
    }

    return {
      ...failedConversion(
        "VAR inlining succeeded but retry conversions failed",
        daxExpression,
      ),
      stage: 4,
      stageName: "var_inline_retry",
      varsInlined: true,
      varsInlinedCount: inliningResult.inlinedCount,
    };
  }

  /**
   * Stage 5: Try AI-powered conversion
   */
  private async tryAiConversion(
    daxExpression: string,
    tokens: DaxToken[],
    context: ConversionContext,
  ): Promise<ConversionResult> {
    // Check for unconvertible functions
    const tokenizer = new DaxTokenizer();
    tokenizer.tokenize(daxExpression); // Need to populate for hasUnconvertibleFunctions

    if (tokenizer.hasUnconvertibleFunctions(this.logger)) {
      return failedConversion(
        "Contains unconvertible functions (CALCULATE, FILTER, etc.)",
        daxExpression,
      );
    }

    // Import AI converter
    try {
      const { convertDaxToMdxWithAi } = await import("./ai-dax-converter");

      const mdxExpression = await convertDaxToMdxWithAi(
        daxExpression,
        this.config.llmName!,
        this.logger,
      );

      if (mdxExpression) {
        // AI conversion succeeded
        // Note: AI converter returns undefined for low confidence (< 0.3 internally)
        return successfulConversion(
          mdxExpression,
          0.5, // Assume moderate confidence when AI returns result
          ConversionCategory.AI_CONVERSION,
          {
            originalDax: daxExpression,
            method: "ai_llm",
            llmName: this.config.llmName,
          },
        );
      }

      return failedConversion("AI conversion returned undefined (low confidence)", daxExpression);
    } catch (error) {
      this.logger.error(
        `AI conversion error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return failedConversion(
        `AI conversion error: ${error}`,
        daxExpression,
      );
    }
  }

  /**
   * Stage 6: Create fallback TODO stub
   * Uses FALSE for boolean-returning functions, 0 for numeric functions
   */
  private createFallback(daxExpression: string): PipelineResult {
    // Use FALSE for boolean-returning functions to avoid "NOT operator requires Boolean" errors
    const fallbackValue = isBooleanReturningExpression(daxExpression) ? "FALSE" : "0";
    return {
      success: true,
      expression: `${fallbackValue} /* TODO: ${escapeForComment(daxExpression)} */`,
      confidence: 0.0,
      category: ConversionCategory.UNCONVERTIBLE,
      stage: 6,
      stageName: "fallback_todo",
      metadata: {
        originalDax: daxExpression,
        method: "fallback",
      },
    };
  }

  /**
   * Convert tokens to MDX strings (helper for direct conversion)
   * Filters out CommaTokens since the direct converter adds its own commas.
   * Also handles negative numbers where "-" and number are separate tokens.
   * @param parentAggFn - If set, indicates this is inside an aggregate function (SUM, COUNT, etc.)
   *                      and should be used when creating metrics from column references
   */
  private convertTokensToMdx(
    tokens: DaxToken[],
    context: ConversionContext,
    parentAggFn?: string,
  ): string[] {
    const info = {
      bim: context.bim,
      expr: context.daxExpression,
      tableName: context.tableName,
      result: context.result,
      attrMaps: context.attrMaps,
      unusedTables: context.unusedTables,
      measureConverter: context.measureConverter,
      parentAggFn,
    };

    const results: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Skip CommaTokens - the direct converter adds its own commas
      if (token instanceof CommaToken) {
        continue;
      }

      // Handle negative numbers: "-" followed by a number
      if (token instanceof OperatorToken && token.value === "-") {
        const nextToken = tokens[i + 1];
        if (nextToken instanceof LiteralToken) {
          // Combine "-" and number into a single negative number
          results.push(`-${nextToken.toMdx(info)}`);
          i++; // Skip the next token since we combined it
          continue;
        }
      }

      results.push(token.toMdx(info));
    }

    return results;
  }

  /**
   * Check if expression contains VAR declarations
   * Used to detect expressions that need VAR inlining before template conversion
   */
  private expressionHasVars(daxExpression: string): boolean {
    try {
      const expression = DaxExpression.parse(daxExpression);
      return expression.hasVariables();
    } catch (error) {
      // If parsing fails, assume no VARs (will fail later in pipeline anyway)
      return false;
    }
  }

  /**
   * Get pipeline statistics
   */
  public getStats(): {
    directMappings: number;
    templates: number;
    aiEnabled: boolean;
    aiMinConfidence: number;
  } {
    return {
      directMappings: this.directConverter.getStats().directMappings,
      templates: this.templateRegistry.getStats().totalTemplates,
      aiEnabled: this.config.aiEnabled,
      aiMinConfidence: this.config.aiMinConfidence,
    };
  }
}
