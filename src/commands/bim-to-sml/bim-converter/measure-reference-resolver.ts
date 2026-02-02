/**
 * measure-reference-resolver.ts
 *
 * Handles reference resolution for BIM measure conversion:
 * - Building measure-to-table lookup maps
 * - Resolving __UNRESOLVED__ markers in MDX expressions
 * - Managing split measure registry for dual-context measures
 * - Rewriting references to split measures in expressions
 */

import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { BimRoot } from "../bim-models/bim-model";
import { AttributeMaps } from "../bim-models/types-and-interfaces";
import {
  escapeForComment,
  expressionAsString,
  makeUniqueName,
  removeComments,
} from "./tools";
import { rewriteSplitMeasureReferences as rewriteSplitRefs } from "./type-inference";

/**
 * Handles reference resolution for measure conversions.
 * Manages measure-to-table lookups, unresolved reference markers,
 * and split measure registry for dual-context measures.
 */
export class MeasureReferenceResolver {
  private logger: Logger;

  /** Map of measure label (original name) -> table name */
  private measureTableMap: Map<string, string> = new Map();

  /**
   * Tracks split measures created during conversion.
   * Maps original measure name → [numericUniqueName, booleanUniqueName]
   */
  private splitMeasureRegistry: Map<string, [string, string]> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Build a lookup of measure names to their tables.
   * This is used for reference resolution when measures reference other measures
   * that haven't been converted yet.
   */
  buildMeasureTableMap(bim: BimRoot): void {
    this.measureTableMap.clear();
    for (const table of bim.model?.tables || []) {
      for (const measure of table.measures || []) {
        // Store mapping: measureName -> tableName
        this.measureTableMap.set(measure.name, table.name);
      }
    }
    this.logger.debug?.(`Built measure lookup with ${this.measureTableMap.size} measures`);
  }

  /**
   * Get the table name for a measure by its label/name.
   * Used for resolving cross-measure references.
   */
  getMeasureTable(measureName: string): string | undefined {
    return this.measureTableMap.get(measureName);
  }

  /**
   * Register a split measure pair for later reference rewriting.
   * @param originalName - Original measure name (without suffix)
   * @param numericUniqueName - Unique name of the _num variant
   * @param booleanUniqueName - Unique name of the _bool variant
   */
  registerSplitMeasure(originalName: string, numericUniqueName: string, booleanUniqueName: string): void {
    this.splitMeasureRegistry.set(originalName, [numericUniqueName, booleanUniqueName]);
  }

  /**
   * Get all registered split measures.
   * @returns Set of original measure names that were split
   */
  getSplitMeasureNames(): Set<string> {
    return new Set(this.splitMeasureRegistry.keys());
  }

  /**
   * Post-process all calculated metrics to resolve __UNRESOLVED__ markers
   * and fix metric name mismatches caused by filename encoding (e.g., w/o → w_o).
   * Called after all measures have been converted.
   */
  resolveUnresolvedReferences(
    result: SmlConverterResult,
    attrMaps: AttributeMaps,
  ): void {
    const unresolvedPattern = /\[Measures\]\.\[__UNRESOLVED__(.+?)__\]/g;
    let resolvedCount = 0;
    let unresolvedCount = 0;

    // Build set of all valid metric unique_names (base metrics + calcs)
    // If a referenced name is already a valid unique_name, don't remap it
    const validUniqueNames = new Set<string>();
    for (const metric of result.measures) {
      validUniqueNames.add(metric.unique_name);
    }
    for (const calc of result.measuresCalculated) {
      validUniqueNames.add(calc.unique_name);
    }

    // Build a lookup map from original column/measure name to actual unique_name
    // This handles cases where unique_name was encoded (e.g., "GR Value w/o BOM" → "GR Value w_o BOM")
    const nameToUniqueName = new Map<string, string>();

    // Add all base metrics (from columns)
    for (const metric of result.measures) {
      if (metric.column && metric.unique_name !== metric.column) {
        nameToUniqueName.set(metric.column, metric.unique_name);
      }
      // Also add by label if different from unique_name
      if (metric.label && metric.unique_name !== metric.label) {
        nameToUniqueName.set(metric.label, metric.unique_name);
      }
    }

    // Add all calculated metrics
    // IMPORTANT: Only add if the label doesn't already map to a base metric unique_name
    // Otherwise we'd overwrite a correct reference (e.g., calc "Post-Close Actual Hours_Current"
    // with label "Post-Close Actual Hours" should not override base metric "Post-Close Actual Hours")
    for (const calc of result.measuresCalculated) {
      if (calc.label && calc.unique_name !== calc.label) {
        // Don't add if the label is already a valid unique_name (base metric with same name)
        if (!validUniqueNames.has(calc.label) && !nameToUniqueName.has(calc.label)) {
          nameToUniqueName.set(calc.label, calc.unique_name);
        }
      }
    }

    for (const calc of result.measuresCalculated) {
      if (!calc.expression) continue;

      // First pass: resolve __UNRESOLVED__ markers
      let newExpression = calc.expression.replace(unresolvedPattern, (match, measureName) => {
        // Find the table for this measure
        const tableName = this.measureTableMap.get(measureName);
        if (!tableName) {
          unresolvedCount++;
          this.logger.warn(`Could not resolve reference to measure '${measureName}' in calc '${calc.unique_name}'`);
          return `[Measures].[${measureName}]`; // Use original name as fallback
        }

        // Look up the unique_name in attrNameMap
        const calcKey = (makeUniqueName(`calculation.${tableName}.`) + measureName).toLowerCase();
        const lookupResult = attrMaps.attrNameMap.get(calcKey);
        if (lookupResult && lookupResult.length > 0) {
          resolvedCount++;
          return `[Measures].[${lookupResult[0]}]`;
        }

        unresolvedCount++;
        this.logger.warn(`Could not find unique_name for measure '${measureName}' in calc '${calc.unique_name}'`);
        return `[Measures].[${measureName}]`; // Use original name as fallback
      });

      // Second pass: resolve encoded name mismatches (e.g., [Measures].[GR Value w/o BOM] → [Measures].[GR Value w_o BOM])
      // Match all [Measures].[name] patterns and check if the name needs to be replaced with encoded unique_name
      const measureRefPattern = /\[Measures\]\.\[([^\]]+)\]/g;
      newExpression = newExpression.replace(measureRefPattern, (match, referencedName) => {
        // Skip if this is an __UNRESOLVED__ marker (already handled above)
        if (referencedName.startsWith("__UNRESOLVED__")) {
          return match;
        }

        // Skip if the referenced name is already a valid unique_name
        // This prevents incorrectly remapping valid base metric references
        if (validUniqueNames.has(referencedName)) {
          return match;
        }

        // Check if we have a mapping for this name to a different unique_name
        const actualUniqueName = nameToUniqueName.get(referencedName);
        if (actualUniqueName && actualUniqueName !== referencedName) {
          resolvedCount++;
          return `[Measures].[${actualUniqueName}]`;
        }

        // Also check metricLookup for base metrics by column name
        // Skip calc entries (key starts with 'calc') - they store measure labels as colName
        // which can conflict with base metric column names
        for (const [key, metricInfo] of attrMaps.metricLookup.entries()) {
          if (key.startsWith('calc')) continue; // Skip calculated metric entries
          if (metricInfo.colName === referencedName && metricInfo.uniqueName !== referencedName) {
            resolvedCount++;
            return `[Measures].[${metricInfo.uniqueName}]`;
          }
        }

        return match; // No change needed
      });

      calc.expression = newExpression;
    }

    if (resolvedCount > 0 || unresolvedCount > 0) {
      this.logger.info(`Resolved ${resolvedCount} measure references, ${unresolvedCount} could not be resolved`);
    }
  }

  /**
   * Rewrite references to split measures in all calculated metric expressions.
   * After identifying dual-context measures and creating split versions (_num and _bool),
   * this method updates references in OTHER expressions to use the appropriate version
   * based on context.
   *
   * @param result - SML converter result containing all calculated metrics
   * @param bim - BIM root for looking up original DAX expressions
   */
  rewriteSplitMeasureReferences(
    result: SmlConverterResult,
    bim: BimRoot,
  ): void {
    const splitMeasures = this.getSplitMeasureNames();

    if (splitMeasures.size === 0) {
      return; // No split measures to rewrite
    }

    this.logger.info(`Rewriting references to ${splitMeasures.size} split measure(s): ${Array.from(splitMeasures).join(', ')}`);

    let rewriteCount = 0;

    // Build a map of measure name → original DAX expression for type inference
    const measureDaxMap = new Map<string, string>();
    for (const table of bim.model?.tables || []) {
      for (const measure of table.measures || []) {
        measureDaxMap.set(measure.name, removeComments(expressionAsString(measure.expression)));
      }
    }

    for (const calc of result.measuresCalculated) {
      if (!calc.expression) continue;

      // Skip split measures themselves (they don't reference other split measures)
      if (calc.label?.endsWith('_num') || calc.label?.endsWith('_bool')) {
        continue;
      }

      // Get the original DAX expression for this measure for type inference
      const originalDax = measureDaxMap.get(calc.label || '') || calc.expression;

      // Rewrite references using type-aware logic
      const rewriteResult = rewriteSplitRefs(
        calc.expression,
        splitMeasures,
        originalDax,
      );

      if (rewriteResult.modified) {
        // Add a comment preserving the original expression if not already present
        const todoMatch = calc.expression.match(/\/\* TODO[^*]*\*\//);
        if (!todoMatch) {
          calc.expression = `${rewriteResult.expression} /* References to split measures rewritten from: ${escapeForComment(rewriteResult.originalExpression)} */`;
        } else {
          calc.expression = rewriteResult.expression;
        }
        rewriteCount++;
        this.logger.debug?.(`Rewrote split measure references in '${calc.label}': ${calc.expression}`);
      }
    }

    if (rewriteCount > 0) {
      this.logger.info(`Rewrote references in ${rewriteCount} expression(s) to use split measures`);
    }
  }
}
