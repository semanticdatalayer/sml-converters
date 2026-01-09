import {
  ConversionTemplate,
  ConversionExample,
} from "../template-base";
import { DaxToken, FunctionToken, CommaToken, TableColumnReference, ColumnReference } from "../../dax-converter";
import {
  ConversionResult,
  ConversionCategory,
  successfulConversion,
  failedConversion,
} from "../../conversion-result";
import { ConversionContext } from "../conversion-context";

/**
 * Valid outer/inner aggregation pairs where re-aggregating partials equals the total.
 * Key: outer iterator function (e.g., SUMX)
 * Value: matching inner aggregation function (e.g., SUM)
 */
const VALID_AGG_PAIRS: Record<string, string> = {
  SUMX: "SUM",
  MINX: "MIN",
  MAXX: "MAX",
};

/**
 * IteratorAggregateTemplate converts DAX iterator patterns over VALUES to simple metric references.
 *
 * Pattern:
 *   SUMX(VALUES(dim[col]), CALCULATE(SUM(fact[measure])))
 *   → [Measures].[measure_unique_name]
 *
 * This works because:
 * 1. VALUES(dim[col]) returns distinct values of a dimension column
 * 2. For each value, CALCULATE evaluates SUM in that context (a partition)
 * 3. SUMX sums all partitions, which equals the total SUM
 *
 * Valid combinations (outer → inner):
 * - SUMX → SUM (sum of sums = sum)
 * - MINX → MIN (min of mins = min)
 * - MAXX → MAX (max of maxes = max)
 *
 * NOT valid (would produce wrong results):
 * - AVERAGEX → AVG (average of averages ≠ average)
 * - COUNTX → COUNT (count of counts ≠ count)
 *
 * Confidence: 0.95 (high confidence - semantic equivalence for additive aggregations)
 */
export class IteratorAggregateTemplate extends ConversionTemplate {
  readonly name = "IteratorAggregateTemplate";
  readonly confidence = 0.95;

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    // Must have exactly one token at root level
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];

    // Must be an iterator function (SUMX, MINX, MAXX)
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    const outerFunc = token.functionAgg.toUpperCase();
    if (!VALID_AGG_PAIRS[outerFunc]) {
      return false;
    }

    // Must have exactly 2 arguments: VALUES(...) and CALCULATE(...)
    const argCount = this.countArguments(token.args);
    if (argCount !== 2) {
      this.log(`Rejected: expected 2 args, got ${argCount}`, context);
      return false;
    }

    const argGroups = this.splitArguments(token.args);
    if (argGroups.length !== 2) {
      return false;
    }

    // First arg must be VALUES(table[column])
    const valuesArg = argGroups[0];
    if (!this.isValuesExpression(valuesArg)) {
      this.log(`Rejected: first arg is not VALUES(table[column])`, context);
      return false;
    }

    // Second arg must be CALCULATE(AGG(fact[col])) with matching agg type
    const calculateArg = argGroups[1];
    const innerAggResult = this.extractCalculateAggregation(calculateArg, outerFunc);
    if (!innerAggResult.valid) {
      this.log(`Rejected: ${innerAggResult.reason}`, context);
      return false;
    }

    return true;
  }

  convert(tokens: DaxToken[], context: ConversionContext): ConversionResult {
    const token = tokens[0] as FunctionToken;
    const outerFunc = token.functionAgg.toUpperCase();
    const argGroups = this.splitArguments(token.args);

    // Extract the inner aggregation from CALCULATE
    const calculateArg = argGroups[1];
    const innerAggResult = this.extractCalculateAggregation(calculateArg, outerFunc);

    if (!innerAggResult.valid || !innerAggResult.aggToken) {
      return failedConversion(
        `Failed to extract inner aggregation: ${innerAggResult.reason}`,
        token.functionAgg,
      );
    }

    // Get the measure reference from the inner aggregation
    // The inner aggregation is like SUM(table[column])
    const aggToken = innerAggResult.aggToken;
    const innerArgs = this.splitArguments(aggToken.args);

    if (innerArgs.length !== 1) {
      return failedConversion(
        `Inner aggregation must have exactly 1 argument`,
        aggToken.functionAgg,
      );
    }

    // Convert just the column reference to MDX (not the whole SUM(...))
    // The base metric already has the aggregation baked in, so we don't need the wrapper
    const measureMdx = this.convertSubExpression(innerArgs[0], context);

    return successfulConversion(
      measureMdx,
      this.confidence,
      ConversionCategory.TEMPLATE_CONVERSION,
      {
        originalDax: token.toString(),
        method: "iterator_aggregate_template",
        outerFunction: outerFunc,
        innerFunction: innerAggResult.aggToken.functionAgg.toUpperCase(),
        note: `${outerFunc}(VALUES(...), CALCULATE(${innerAggResult.aggToken.functionAgg.toUpperCase()}(...))) simplified to base metric`,
      },
    );
  }

  /**
   * Check if tokens represent VALUES(table[column])
   */
  private isValuesExpression(tokens: DaxToken[]): boolean {
    // Should be a single FunctionToken with name VALUES
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    if (token.functionAgg.toUpperCase() !== "VALUES") {
      return false;
    }

    // VALUES should have exactly 1 argument - a column reference
    const argCount = this.countArguments(token.args);
    if (argCount !== 1) {
      return false;
    }

    // The argument should be a table[column] or [column] reference
    const args = this.splitArguments(token.args);
    if (args.length !== 1) {
      return false;
    }

    const arg = args[0];
    if (arg.length !== 1) {
      return false;
    }

    // Accept TableColumnReference or ColumnReference
    return (
      arg[0] instanceof TableColumnReference ||
      arg[0] instanceof ColumnReference
    );
  }

  /**
   * Extract and validate the aggregation from CALCULATE(AGG(fact[col]))
   * Returns the inner aggregation token if valid, or reason for rejection
   */
  private extractCalculateAggregation(
    tokens: DaxToken[],
    outerFunc: string,
  ): { valid: boolean; reason?: string; aggToken?: FunctionToken } {
    // Should be a single FunctionToken with name CALCULATE
    if (tokens.length !== 1) {
      return { valid: false, reason: "CALCULATE arg is not a single token" };
    }

    const token = tokens[0];
    if (!(token instanceof FunctionToken)) {
      return { valid: false, reason: "second arg is not a function" };
    }

    if (token.functionAgg.toUpperCase() !== "CALCULATE") {
      return { valid: false, reason: `second arg is ${token.functionAgg}, not CALCULATE` };
    }

    // CALCULATE should have exactly 1 argument (the aggregation, no filters)
    const argCount = this.countArguments(token.args);
    if (argCount !== 1) {
      return { valid: false, reason: `CALCULATE has ${argCount} args, expected 1 (no filters)` };
    }

    const args = this.splitArguments(token.args);
    if (args.length !== 1 || args[0].length !== 1) {
      return { valid: false, reason: "CALCULATE inner arg structure invalid" };
    }

    const innerToken = args[0][0];
    if (!(innerToken instanceof FunctionToken)) {
      return { valid: false, reason: "CALCULATE inner arg is not a function" };
    }

    // Check that inner aggregation matches outer iterator
    const innerFunc = innerToken.functionAgg.toUpperCase();
    const expectedInner = VALID_AGG_PAIRS[outerFunc];

    if (innerFunc !== expectedInner) {
      return {
        valid: false,
        reason: `${outerFunc} requires ${expectedInner} inside, but found ${innerFunc}`,
      };
    }

    // Inner aggregation should have exactly 1 argument (the column reference)
    const innerArgCount = this.countArguments(innerToken.args);
    if (innerArgCount !== 1) {
      return {
        valid: false,
        reason: `inner ${innerFunc} has ${innerArgCount} args, expected 1`,
      };
    }

    return { valid: true, aggToken: innerToken };
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

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  getExamples(): ConversionExample[] {
    return [
      {
        dax: "SUMX(VALUES(DATE_DIM[d_year]), CALCULATE(SUM(STORE_SALES[ss_net_paid])))",
        mdx: "[Measures].[ss_net_paid]",
        description: "SUMX over VALUES with CALCULATE(SUM) → base metric",
      },
      {
        dax: "MINX(VALUES(Product[Category]), CALCULATE(MIN(Sales[Amount])))",
        mdx: "[Measures].[Amount]",
        description: "MINX over VALUES with CALCULATE(MIN) → base metric",
      },
      {
        dax: "MAXX(VALUES(Region[Country]), CALCULATE(MAX(Orders[Total])))",
        mdx: "[Measures].[Total]",
        description: "MAXX over VALUES with CALCULATE(MAX) → base metric",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX iterator patterns like SUMX(VALUES(dim[col]), CALCULATE(SUM(fact[col]))) " +
      "to simple metric references. Works because re-aggregating partitions equals the total " +
      "for additive aggregations (SUM, MIN, MAX). " +
      "Does not handle AVERAGEX or COUNTX (non-additive). " +
      "Requires CALCULATE with no filters."
    );
  }
}
