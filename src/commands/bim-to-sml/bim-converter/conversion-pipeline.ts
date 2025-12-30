import { DaxTokenizer, DaxToken, FunctionToken } from "./dax-converter";
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
 * ConversionPipeline orchestrates the 5-stage DAX to MDX conversion process.
 *
 * Pipeline stages:
 * 1. Direct conversion - Simple 1:1 DAX→MDX function mappings (conf: 1.0)
 * 2. Template conversion - Pattern-based conversion (DIVIDE, etc.) (conf: 0.9-1.0)
 * 3. VAR inline + retry - Inline safe VARs, retry stages 1-2 (conf: varies)
 * 4. AI conversion - LLM-powered conversion (conf: 0.0-0.7)
 * 5. Fallback TODO - Placeholder with original DAX (conf: 0.0)
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

    // Stage 2: Template conversion
    const stage2Result = this.tryTemplateConversion(tokens, context);
    if (stage2Result.success && stage2Result.confidence >= 0.85) {
      this.logger.debug(`Stage 2 (Template) succeeded: ${stage2Result.expression}`);
      return {
        ...stage2Result,
        stage: 2,
        stageName: "template_conversion",
      };
    }

    // Stage 3: VAR inline + retry
    const stage3Result = await this.tryVarInlineAndRetry(
      daxExpression,
      tokens,
      context,
    );
    if (stage3Result.success) {
      this.logger.debug(
        `Stage 3 (VAR inline) succeeded: ${stage3Result.expression}`,
      );
      return stage3Result;
    }

    // Stage 4: AI conversion (if enabled)
    if (this.config.aiEnabled && this.config.llmName) {
      const stage4Result = await this.tryAiConversion(
        daxExpression,
        tokens,
        context,
      );
      if (stage4Result.success && stage4Result.confidence >= this.config.aiMinConfidence) {
        this.logger.debug(`Stage 4 (AI) succeeded: ${stage4Result.expression}`);
        return {
          ...stage4Result,
          stage: 4,
          stageName: "ai_conversion",
        };
      }
    }

    // Stage 5: Fallback TODO
    this.logger.debug("All stages failed, creating fallback TODO");
    return this.createFallback(daxExpression);
  }

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

    // Convert arguments first (recursively)
    const args = this.convertTokensToMdx(token.args, context);

    // Try direct conversion
    return this.directConverter.tryConvert(token, args);
  }

  /**
   * Stage 2: Try template-based conversion
   */
  private tryTemplateConversion(
    tokens: DaxToken[],
    context: ConversionContext,
  ): ConversionResult {
    return this.templateRegistry.tryConvert(tokens, context);
  }

  /**
   * Stage 3: Try VAR inlining + retry stages 1-2
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
        stage: 3,
        stageName: "var_inline_retry",
      };
    }

    // If no VARs, skip this stage
    if (!expression.hasVariables()) {
      return {
        ...failedConversion("No VARs to inline", daxExpression),
        stage: 3,
        stageName: "var_inline_retry",
      };
    }

    // Try to inline VARs
    const inliningResult = this.varInliner.inline(expression);

    if (!inliningResult.modified) {
      this.logger.debug("VAR inlining: no VARs were safe to inline");
      return {
        ...failedConversion("No safe VARs to inline", daxExpression),
        stage: 3,
        stageName: "var_inline_retry",
      };
    }

    this.logger.debug(
      `VAR inlining: ${inliningResult.inlinedCount} VARs inlined, ${inliningResult.remainingCount} remaining`,
    );

    // Retry stage 1: Direct conversion
    const stage1Retry = this.tryDirectConversion(
      inliningResult.tokens,
      context,
    );
    if (stage1Retry.success && stage1Retry.confidence >= 0.95) {
      return {
        ...stage1Retry,
        stage: 3,
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

    // Retry stage 2: Template conversion
    const stage2Retry = this.tryTemplateConversion(
      inliningResult.tokens,
      context,
    );
    if (stage2Retry.success && stage2Retry.confidence >= 0.85) {
      return {
        ...stage2Retry,
        stage: 3,
        stageName: "var_inline_retry",
        category: ConversionCategory.VAR_INLINED,
        varsInlined: true,
        varsInlinedCount: inliningResult.inlinedCount,
        metadata: {
          ...stage2Retry.metadata,
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
      stage: 3,
      stageName: "var_inline_retry",
      varsInlined: true,
      varsInlinedCount: inliningResult.inlinedCount,
    };
  }

  /**
   * Stage 4: Try AI-powered conversion
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
   * Stage 5: Create fallback TODO stub
   */
  private createFallback(daxExpression: string): PipelineResult {
    return {
      success: true,
      expression: `0 /* TODO: ${daxExpression} */`,
      confidence: 0.0,
      category: ConversionCategory.UNCONVERTIBLE,
      stage: 5,
      stageName: "fallback_todo",
      metadata: {
        originalDax: daxExpression,
        method: "fallback",
      },
    };
  }

  /**
   * Convert tokens to MDX strings (helper for direct conversion)
   */
  private convertTokensToMdx(
    tokens: DaxToken[],
    context: ConversionContext,
  ): string[] {
    const info = {
      bim: context.bim,
      expr: context.daxExpression,
      tableName: context.tableName,
      result: context.result,
      attrMaps: context.attrMaps,
      unusedTables: context.unusedTables,
      measureConverter: context.measureConverter,
    };

    return tokens.map((token) => token.toMdx(info));
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
