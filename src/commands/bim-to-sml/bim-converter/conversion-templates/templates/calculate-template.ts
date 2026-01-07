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
 * - CALCULATE(SUM(col), dim IN {val1, val2}) → IIF((dim = val1 OR dim = val2), SUM(col), NULL)
 *
 * Supports simple comparison filters: =, <>, >, <, >=, <=, IN
 * Does NOT handle:
 * - FILTER() expressions
 * - REMOVEFILTERS/ALL/ALLEXCEPT
 * - TREATAS
 * - Relationship functions (RELATED, VALUES, etc.)
 * - Time intelligence functions
 *
 * Confidence: 0.9 for simple filters, 1.0 for no filters, 0.85 for IN operators
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
        // Check if this filter uses IN operator
        const hasIn = argGroups[i].some(
          (t) => t instanceof IdentifierToken && t.value.toUpperCase() === "IN"
        );

        if (hasIn) {
          // Handle IN operator specially - convert to OR chain
          const filterMdx = this.convertInFilter(argGroups[i], context);
          filterConditions.push(filterMdx);
        } else {
          // Standard filter conversion
          const filterMdx = this.convertSubExpression(argGroups[i], context);
          filterConditions.push(filterMdx);
        }
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
   * Check if a token group represents a simple comparison filter or IN operator
   * Pattern: column OPERATOR value or column IN {values} or FUNCTION(column) OPERATOR value
   * Supported operators: =, <>, >, <, >=, <=, IN
   *
   * Returns object with isSimple flag and reason for rejection
   */
  private isSimpleComparisonFilter(tokens: DaxToken[]): { isSimple: boolean; reason?: string } {
    // Look for pattern: <something> OPERATOR <something> or <something> IN {values}
    // We need to find a comparison operator or IN keyword
    let hasComparisonOperator = false;
    let hasInOperator = false;
    const validOperators = ["=", "<>", ">", "<", ">=", "<=", "!="];

    for (const token of tokens) {
      if (token instanceof OperatorToken && validOperators.includes(token.value)) {
        hasComparisonOperator = true;
        break;
      }
      if (token instanceof IdentifierToken && token.value.toUpperCase() === "IN") {
        hasInOperator = true;
        break;
      }
    }

    if (!hasComparisonOperator && !hasInOperator) {
      return { isSimple: false, reason: "No comparison operator (=, <>, >, <, >=, <=) or IN found" };
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
    }

    return { isSimple: true };
  }

  /**
   * Convert IN operator expression to OR chain
   * Pattern: column IN {val1, val2, val3} → (column = val1 OR column = val2 OR column = val3)
   */
  private convertInFilter(tokens: DaxToken[], context: ConversionContext): string {
    // Find the IN keyword position
    let inIndex = -1;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] instanceof IdentifierToken && tokens[i].value.toUpperCase() === "IN") {
        inIndex = i;
        break;
      }
    }

    if (inIndex === -1) {
      throw new Error("IN operator not found in filter");
    }

    // Left side: expression before IN
    const leftTokens = tokens.slice(0, inIndex);
    const leftExpr = this.convertSubExpression(leftTokens, context);

    // Right side: values after IN (in braces)
    // Convert to MDX first to get the raw string, then parse values
    const rightTokens = tokens.slice(inIndex + 1);
    const rightExpr = this.convertSubExpression(rightTokens, context);

    // Parse values from brace expression: { val1, val2, val3 }
    // The rightExpr might look like "{ val1 , val2 , val3 }" or similar
    // Remove braces and split by commas
    const cleaned = rightExpr.replace(/[{}]/g, "").trim();

    // If empty, return a false condition
    if (!cleaned) {
      return "1 = 0"; // Always false
    }

    // Split by commas and trim each value
    const values = cleaned.split(",").map((v) => v.trim()).filter((v) => v.length > 0);

    if (values.length === 0) {
      return "1 = 0"; // Always false
    }

    // Create OR conditions
    const orConditions = values.map((val) => `${leftExpr} = ${val}`);

    // Return parenthesized OR chain
    return `(${orConditions.join(" OR ")})`;
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
      {
        dax: 'CALCULATE(SUM([Sales]), [Category] IN {"A", "B", "C"})',
        mdx: 'IIF(([Category] = "A" OR [Category] = "B" OR [Category] = "C"), SUM([Sales]), NULL)',
        description: "IN operator with multiple values",
      },
      {
        dax: 'CALCULATE([Revenue], [Status] IN {"Active", "Pending"})',
        mdx: 'IIF(([Status] = "Active" OR [Status] = "Pending"), [Revenue], NULL)',
        description: "IN operator filter",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts simple DAX CALCULATE expressions to MDX. " +
      "Supports: (1) CALCULATE with no filters → unwraps to inner expression, " +
      "(2) CALCULATE with simple comparison filters → IIF with conditions, " +
      "(3) CALCULATE with IN operator → IIF with OR chain. " +
      "Supports comparison operators: =, <>, >, <, >=, <=. " +
      "Supports IN operator: column IN {val1, val2} → (column = val1 OR column = val2). " +
      "Does not handle: FILTER(), REMOVEFILTERS, TREATAS, time intelligence, or relationship functions. " +
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
