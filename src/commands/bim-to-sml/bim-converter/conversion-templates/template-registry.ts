import { ConversionTemplate } from "./template-base";
import { DivideTemplate } from "./templates/divide-template";
import { IfTemplate } from "./templates/if-template";
import { IsBlankTemplate } from "./templates/isblank-template";
import { IfErrorTemplate } from "./templates/iferror-template";
import { SwitchTemplate } from "./templates/switch-template";
import { CalculateTemplate } from "./templates/calculate-template";
import { LogicalTemplate } from "./templates/logical-template";
import { IteratorAggregateTemplate } from "./templates/iterator-aggregate-template";
import { InOperatorTemplate } from "./templates/in-operator-template";
import { ConcatenateTemplate } from "./templates/concatenate-template";
import { TotalYtdTemplate } from "./templates/totalytd-template";
import { TotalMtdTemplate } from "./templates/totalmtd-template";
import { TotalQtdTemplate } from "./templates/totalqtd-template";
import { SamePeriodLastYearTemplate } from "./templates/sameperiodlastyear-template";
import { PreviousMonthTemplate } from "./templates/previousmonth-template";
import { ParallelPeriodTemplate } from "./templates/parallelperiod-template";
// Disabled: ClosingPeriod, Lag tuple, and .Item(0) not supported by AtScale
// import { ClosingBalanceMonthTemplate } from "./templates/closingbalancemonth-template";
// import { DateAddTemplate } from "./templates/dateadd-template";
// import { LastNonBlankTemplate } from "./templates/lastnonblank-template";
import { DaxToken, DaxTokenizer } from "../dax-converter";
import {
  ConversionResult,
  failedConversion,
} from "../conversion-result";
import { ConversionContext } from "./conversion-context";
import { Logger } from "../../../../shared/logger";

/**
 * TemplateRegistry manages all conversion templates and provides template matching.
 *
 * Templates are:
 * - Sorted by confidence (highest first)
 * - Matched against tokenized DAX expressions
 * - Applied in order until one succeeds
 *
 * Usage:
 * ```typescript
 * const registry = TemplateRegistry.getInstance(logger);
 * const result = registry.tryConvert(tokens, context);
 * if (result.success) {
 *   // Use result.expression
 * }
 * ```
 */
export class TemplateRegistry {
  private static instance: TemplateRegistry;
  private templates: ConversionTemplate[] = [];

  private constructor(private logger: Logger) {
    this.registerDefaultTemplates();
    this.sortTemplatesByConfidence();
    this.logRegisteredTemplates();
  }

  /**
   * Get singleton instance of TemplateRegistry
   */
  public static getInstance(logger: Logger): TemplateRegistry {
    if (!TemplateRegistry.instance) {
      TemplateRegistry.instance = new TemplateRegistry(logger);
    }
    return TemplateRegistry.instance;
  }

  /**
   * Register default templates
   */
  private registerDefaultTemplates(): void {
    // Register core templates (sorted by confidence automatically)
    this.registerTemplate(new DivideTemplate());
    this.registerTemplate(new IfTemplate());
    this.registerTemplate(new IsBlankTemplate());
    this.registerTemplate(new IfErrorTemplate());
    this.registerTemplate(new SwitchTemplate());
    this.registerTemplate(new CalculateTemplate());
    this.registerTemplate(new LogicalTemplate());
    this.registerTemplate(new IteratorAggregateTemplate());
    this.registerTemplate(new InOperatorTemplate());
    this.registerTemplate(new ConcatenateTemplate());
    this.registerTemplate(new TotalYtdTemplate());
    this.registerTemplate(new TotalMtdTemplate());
    this.registerTemplate(new TotalQtdTemplate());
    this.registerTemplate(new SamePeriodLastYearTemplate());
    this.registerTemplate(new PreviousMonthTemplate());
    this.registerTemplate(new ParallelPeriodTemplate());
    // Disabled: ClosingPeriod, Lag tuple, and .Item(0) not supported by AtScale
    // this.registerTemplate(new ClosingBalanceMonthTemplate());
    // this.registerTemplate(new DateAddTemplate());
    // this.registerTemplate(new LastNonBlankTemplate());
  }

  /**
   * Register a template
   * @param template - Template to register
   */
  public registerTemplate(template: ConversionTemplate): void {
    this.templates.push(template);
  }

  /**
   * Log all registered templates in a single consolidated message
   */
  private logRegisteredTemplates(): void {
    const templateList = this.templates
      .map((t) => `${t.name} (${t.confidence})`)
      .join(", ");
    this.logger.debug(`Registered templates: ${templateList}`);
  }

  /**
   * Sort templates by confidence (highest first)
   */
  private sortTemplatesByConfidence(): void {
    this.templates.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Try to convert DAX expression using templates
   * @param daxExpression - DAX expression string
   * @param context - Conversion context
   * @returns ConversionResult if template matched, otherwise failure
   */
  public tryConvertExpression(
    daxExpression: string,
    context: ConversionContext,
  ): ConversionResult {
    // Tokenize expression
    const tokenizer = new DaxTokenizer();
    const tokens = tokenizer.tokenize(daxExpression);

    return this.tryConvert(tokens, context);
  }

  /**
   * Try to convert tokenized DAX using templates
   * @param tokens - Tokenized DAX expression
   * @param context - Conversion context
   * @returns ConversionResult if template matched, otherwise failure
   */
  public tryConvert(
    tokens: DaxToken[],
    context: ConversionContext,
  ): ConversionResult {
    // Try each template in order (highest confidence first)
    for (const template of this.templates) {
      if (template.canConvert(tokens, context)) {
        this.logger.debug(
          `Template matched: ${template.name} for expression: ${context.daxExpression}`,
        );

        try {
          const result = template.convert(tokens, context);

          if (result.success) {
            this.logger.debug(
              `Template ${template.name} converted successfully: ${result.expression}`,
            );
            return result;
          } else {
            this.logger.warn(
              `Template ${template.name} matched but conversion failed: ${result.error}`,
            );
            // Continue to next template
          }
        } catch (error) {
          this.logger.error(
            `Template ${template.name} threw error: ${error instanceof Error ? error.message : String(error)}`,
          );
          // Continue to next template
        }
      }
    }

    // No template matched
    return failedConversion(
      "No template matched for expression",
      context.daxExpression,
    );
  }

  /**
   * Get all registered templates
   * @returns Array of templates sorted by confidence
   */
  public getTemplates(): ConversionTemplate[] {
    return [...this.templates];
  }

  /**
   * Get template by name
   * @param name - Template name
   * @returns Template or undefined if not found
   */
  public getTemplate(name: string): ConversionTemplate | undefined {
    return this.templates.find((t) => t.name === name);
  }

  /**
   * Get statistics about registered templates
   */
  public getStats(): {
    totalTemplates: number;
    byConfidence: { [key: string]: number };
  } {
    const byConfidence: { [key: string]: number } = {};

    for (const template of this.templates) {
      const key = template.confidence.toFixed(1);
      byConfidence[key] = (byConfidence[key] || 0) + 1;
    }

    return {
      totalTemplates: this.templates.length,
      byConfidence,
    };
  }

  /**
   * List all templates with their descriptions
   */
  public listTemplates(): Array<{
    name: string;
    confidence: number;
    description: string;
  }> {
    return this.templates.map((template) => ({
      name: template.name,
      confidence: template.confidence,
      description: template.getDescription(),
    }));
  }
}
