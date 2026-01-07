import {
  ConversionTemplate,
  ConversionExample,
} from "../template-base";
import { DaxToken, FunctionToken, CommaToken, OperatorToken, IdentifierToken } from "../../dax-converter";
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
 * - CALCULATE(expr) → expr (no filters, just unwrap)
 * - CALCULATE(SUM(col), dim = value) → IIF(dim = value, SUM(col), NULL)
 * - CALCULATE(SUM(col), dim > 100) → IIF(dim > 100, SUM(col), NULL)
 * - CALCULATE(SUM(col), dim1 = val1, dim2 = val2) → IIF(dim1 = val1 AND dim2 = val2, SUM(col), NULL)
 * - CALCULATE(SUM(col), Date > X, Date <= Y) → IIF(Date > X AND Date <= Y, SUM(col), NULL)
 *
 * Supports simple comparison filters: =, <>, >, <, >=, <=
 * Does NOT handle:
 * - FILTER() expressions
 * - REMOVEFILTERS/ALL/ALLEXCEPT
 * - IN operators
 * - TREATAS
 * - Relationship functions (RELATED, VALUES, etc.)
 * - Time intelligence functions
 *
 * Confidence: 0.9 for simple filters, 1.0 for no filters
 */
export class CalculateTemplate extends ConversionTemplate {
  readonly name = "CalculateTemplate";
  readonly confidence = 0.9;

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

    // Must have at least 1 argument (the aggregation expression)
    const argCount = this.countArguments(token.args);
    if (argCount < 1) {
      return false;
    }

    const argGroups = this.splitArguments(token.args);

    // CRITICAL: Reject if first argument (aggregation) contains unconvertible functions
    // Note: CALCULATE itself is unconvertible per function-mappings.json, but we have
    // a template for simple cases. However, nested unconvertible functions should be rejected.
    if (argGroups.length > 0 && this.containsUnconvertibleFunctions(argGroups[0], context)) {
      this.warn(
        `CALCULATE aggregation argument contains unconvertible functions - rejecting conversion`,
        context,
      );
      return false;
    }

    // If only 1 argument (no filters), accept it - just unwrap the CALCULATE
    if (argCount === 1) {
      return true;
    }

    // If 2+ arguments, check that all filter arguments are simple comparisons
    // Skip first argument (the aggregation)
    for (let i = 1; i < argGroups.length; i++) {
      const filterCheckResult = this.isSimpleComparisonFilter(argGroups[i]);
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

    if (argGroups.length < 1) {
      return failedConversion(
        `CALCULATE requires at least 1 argument, got ${argGroups.length}`,
        token.functionAgg,
      );
    }

    // CRITICAL: Check that converted output won't contain unconvertible functions
    // This prevents outputting invalid MDX like "IIF(CALCULATE(...), ...)"
    for (let i = 0; i < argGroups.length; i++) {
      if (this.containsUnconvertibleFunctions(argGroups[i], context)) {
        return failedConversion(
          `CALCULATE argument ${i} contains unconvertible functions - cannot convert to valid MDX`,
          token.functionAgg,
        );
      }
    }

    try {
      // First argument is the aggregation expression - may recursively invoke templates
      const aggregationMdx = this.convertSubExpression(argGroups[0], context);

      // If only 1 argument (no filters), just unwrap the CALCULATE
      if (argGroups.length === 1) {
        return successfulConversion(
          aggregationMdx,
          1.0, // High confidence - simple unwrapping
          ConversionCategory.TEMPLATE_CONVERSION,
          {
            originalDax: `CALCULATE(${aggregationMdx})`,
            method: "calculate_template_unwrap",
            note: "CALCULATE with no filters - unwrapped to inner expression",
          },
        );
      }

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
          note: "Simple CALCULATE with comparison filters - review context semantics",
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
   * Check if a token group represents a simple comparison filter
   * Pattern: column OPERATOR value or FUNCTION(column) OPERATOR value
   * Supported operators: =, <>, >, <, >=, <=
   *
   * Returns object with isSimple flag and reason for rejection
   */
  private isSimpleComparisonFilter(tokens: DaxToken[]): { isSimple: boolean; reason?: string } {
    // Look for pattern: <something> OPERATOR <something>
    // We need to find a comparison operator
    let hasComparisonOperator = false;
    const validOperators = ["=", "<>", ">", "<", ">=", "<=", "!="];

    for (const token of tokens) {
      if (token instanceof OperatorToken && validOperators.includes(token.value)) {
        hasComparisonOperator = true;
        break;
      }
    }

    if (!hasComparisonOperator) {
      return { isSimple: false, reason: "No comparison operator (=, <>, >, <, >=, <=) found" };
    }

    // Check for unconvertible functions and keywords in the filter
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
          "HASONEVALUE",
          "USERELATIONSHIP",
          "CALCULATETABLE",
          "SUMMARIZE",
          "ADDCOLUMNS",
          "SELECTCOLUMNS",
          "CROSSFILTER",
          "TREATAS",
          "RELATED",
          "RELATEDTABLE",
          // Time intelligence functions
          "TOTALYTD",
          "TOTALQTD",
          "TOTALMTD",
          "SAMEPERIODLASTYEAR",
          "PARALLELPERIOD",
          "DATEADD",
          "DATESBETWEEN",
          "DATESINPERIOD",
        ];

        if (unconvertibleFunctions.includes(funcName)) {
          return { isSimple: false, reason: `Contains unconvertible function: ${funcName}` };
        }

        // Allow convertible functions like YEAR, MONTH, DAY, etc.
        // These can be used in filter conditions: YEAR([Date]) = 2024
      }

      // Check for IN keyword (not yet supported)
      if (token instanceof IdentifierToken || token instanceof FunctionToken) {
        const tokenValue = token.value.toUpperCase();
        if (tokenValue === "IN") {
          return { isSimple: false, reason: "IN operator not yet supported" };
        }
      }
    }

    return { isSimple: true };
  }

  getExamples(): ConversionExample[] {
    return [
      {
        dax: "CALCULATE(SUM([Sales]))",
        mdx: "SUM([Sales])",
        description: "CALCULATE with no filters - unwrapped",
      },
      {
        dax: 'CALCULATE(SUM([Sales]), [Brand] = "Nike")',
        mdx: 'IIF([Brand] = "Nike", SUM([Sales]), NULL)',
        description: "Simple equality filter",
      },
      {
        dax: "CALCULATE(SUM([Revenue]), [Amount] > 1000)",
        mdx: "IIF([Amount] > 1000, SUM([Revenue]), NULL)",
        description: "Greater than comparison filter",
      },
      {
        dax: 'CALCULATE(SUM([Revenue]), [Country] = "US", [Year] = 2024)',
        mdx: 'IIF([Country] = "US" AND [Year] = 2024, SUM([Revenue]), NULL)',
        description: "Multiple filters (AND logic)",
      },
      {
        dax: "CALCULATE([Total Sales], [Date] >= DATE(2024,1,1), [Date] <= DATE(2024,12,31))",
        mdx: "IIF([Date] >= DATE(2024,1,1) AND [Date] <= DATE(2024,12,31), [Total Sales], NULL)",
        description: "Date range filter with comparison operators",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts simple DAX CALCULATE expressions to MDX. " +
      "Supports: (1) CALCULATE with no filters → unwraps to inner expression, " +
      "(2) CALCULATE with simple comparison filters → IIF with conditions. " +
      "Supports comparison operators: =, <>, >, <, >=, <=. " +
      "Does not handle: FILTER(), REMOVEFILTERS, IN operator, TREATAS, time intelligence, or relationship functions. " +
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
