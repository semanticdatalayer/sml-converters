import {
  ConversionTemplate,
  ConversionExample,
} from "../template-base";
import { DaxToken, FunctionToken, CommaToken, OperatorToken } from "../../dax-converter";
import {
  ConversionResult,
  ConversionCategory,
  successfulConversion,
  failedConversion,
} from "../../conversion-result";
import { ConversionContext } from "../conversion-context";

/**
 * CalculateTemplate converts simple DAX CALCULATE patterns to MDX.
 *
 * Handles patterns like:
 * - CALCULATE(SUM(col), dim = value) → IIF(dim = value, SUM(col), NULL)
 * - CALCULATE(SUM(col), dim1 = val1, dim2 = val2) → IIF(dim1 = val1 AND dim2 = val2, SUM(col), NULL)
 *
 * Only converts SIMPLE equality filters (column = value).
 * Does NOT handle:
 * - FILTER() expressions
 * - REMOVEFILTERS/ALL/ALLEXCEPT
 * - Complex boolean logic
 * - IN operators
 * - Relationship functions
 *
 * Confidence: 0.7 (requires manual review for context semantics)
 */
export class CalculateTemplate extends ConversionTemplate {
  readonly name = "CalculateTemplate";
  readonly confidence = 0.85;

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    // Must have exactly one token at root level
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];

    // Must be a CALCULATE function
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    const funcName = token.functionAgg.toUpperCase();
    if (funcName !== "CALCULATE") {
      return false;
    }

    // Must have at least 2 arguments (aggregation + at least one filter)
    const argCount = this.countArguments(token.args);
    if (argCount < 2) {
      return false;
    }

    // Check that all filter arguments are simple equality comparisons
    const argGroups = this.splitArguments(token.args);

    // Skip first argument (the aggregation)
    for (let i = 1; i < argGroups.length; i++) {
      const filterCheckResult = this.isSimpleEqualityFilter(argGroups[i]);
      if (!filterCheckResult.isSimple) {
        this.log(`Rejected: ${filterCheckResult.reason}`, context);
        return false;
      }
    }

    return true;
  }

  convert(tokens: DaxToken[], context: ConversionContext): ConversionResult {
    const token = tokens[0] as FunctionToken;
    const args = token.args;

    // Split arguments
    const argGroups = this.splitArguments(args);

    if (argGroups.length < 2) {
      return failedConversion(
        `CALCULATE requires at least 2 arguments, got ${argGroups.length}`,
        token.functionAgg,
      );
    }

    try {
      // First argument is the aggregation expression - may recursively invoke templates
      const aggregationMdx = this.convertSubExpression(argGroups[0], context);

      // Remaining arguments are filters - convert to AND conditions - may recursively invoke templates
      const filterConditions: string[] = [];

      for (let i = 1; i < argGroups.length; i++) {
        const filterMdx = this.convertSubExpression(argGroups[i], context);
        filterConditions.push(filterMdx);
      }

      // Combine filters with AND
      const combinedFilter = filterConditions.join(" AND ");

      // CALCULATE(agg, filter1, filter2) → IIF(filter1 AND filter2, agg, NULL)
      const mdxExpression = `IIF(${combinedFilter}, ${aggregationMdx}, NULL)`;

      return successfulConversion(
        mdxExpression,
        this.confidence,
        ConversionCategory.TEMPLATE_CONVERSION,
        {
          originalDax: `CALCULATE(${argGroups.map((g) => this.convertSubExpression(g, context)).join(", ")})`,
          method: "calculate_template",
          filterCount: filterConditions.length,
          note: "Simple CALCULATE with equality filters - review context semantics",
        },
      );
    } catch (error) {
      return failedConversion(
        `Failed to convert CALCULATE: ${error instanceof Error ? error.message : String(error)}`,
        token.functionAgg,
      );
    }
  }

  /**
   * Check if a token group represents a simple equality filter
   * Pattern: column = value or FUNCTION(column) = value
   *
   * Returns object with isSimple flag and reason for rejection
   */
  private isSimpleEqualityFilter(tokens: DaxToken[]): { isSimple: boolean; reason?: string } {
    // Look for pattern: <something> = <something>
    // We need to find an equals operator
    let hasEquals = false;

    for (const token of tokens) {
      if (token instanceof OperatorToken && token.value === "=") {
        hasEquals = true;
        break;
      }
    }

    if (!hasEquals) {
      return { isSimple: false, reason: "No equality operator (=) found" };
    }

    // Check for unconvertible functions in the filter
    for (const token of tokens) {
      if (token instanceof FunctionToken) {
        const funcName = token.functionAgg.toUpperCase();

        // List of unconvertible functions that modify filter context
        const unconvertibleFunctions = [
          "FILTER",
          "ALL",
          "ALLEXCEPT",
          "REMOVEFILTERS",
          "KEEPFILTERS",
          "VALUES",
          "DISTINCT",
          "SELECTEDVALUE",
          "USERELATIONSHIP",
          "CALCULATETABLE",
          "SUMMARIZE",
          "ADDCOLUMNS",
          "SELECTCOLUMNS",
          "CROSSFILTER",
          "TREATAS",
        ];

        if (unconvertibleFunctions.includes(funcName)) {
          return { isSimple: false, reason: `Contains unconvertible function: ${funcName}` };
        }

        // Allow convertible functions like YEAR, MONTH, DAY, etc.
        // These can be used in filter conditions: YEAR([Date]) = 2024
      }
    }

    return { isSimple: true };
  }

  getExamples(): ConversionExample[] {
    return [
      {
        dax: 'CALCULATE(SUM([Sales]), [Brand] = "Nike")',
        mdx: 'IIF([Brand] = "Nike", SUM([Sales]), NULL)',
        description: "Simple filter on single dimension",
      },
      {
        dax: 'CALCULATE(SUM([Revenue]), [Country] = "US", [Year] = 2024)',
        mdx: 'IIF([Country] = "US" AND [Year] = 2024, SUM([Revenue]), NULL)',
        description: "Multiple equality filters (AND logic)",
      },
      {
        dax: 'CALCULATE([Total Sales], [Region] = "West")',
        mdx: 'IIF([Region] = "West", [Total Sales], NULL)',
        description: "Filter on measure reference",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts simple DAX CALCULATE expressions with equality filters to MDX IIF expressions. " +
      "CALCULATE(aggregation, col1 = val1, col2 = val2) becomes " +
      "IIF(col1 = val1 AND col2 = val2, aggregation, NULL). " +
      "Only handles simple equality filters (=). Does not handle FILTER(), REMOVEFILTERS, or complex logic. " +
      "Requires manual review for context semantics."
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
}
