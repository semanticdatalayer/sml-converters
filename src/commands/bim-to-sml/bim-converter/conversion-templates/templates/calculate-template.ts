import {
  ConversionTemplate,
  ConversionExample,
} from "../template-base";
import { DaxToken, FunctionToken, CommaToken, OperatorToken, IdentifierToken, TableColumnReference, BraceToken, LiteralToken, ParenToken } from "../../dax-converter";
import {
  ConversionResult,
  ConversionCategory,
  successfulConversion,
  failedConversion,
} from "../../conversion-pipeline";
import { ConversionContext } from "../conversion-context";
import { makeUniqueName } from "../../tools";
import { resolveDimensionHierarchy } from "../../converter-utils";

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
 * - CALCULATE(expr, ALL('Dim1'), ALL('Dim2')) → ([dimension_Dim1].[Hierarchy].[All], [dimension_Dim2].[Hierarchy].[All], expr)
 * - CALCULATE(expr, ALL('Dim'[Column])) → ([dimension_Dim].[Hierarchy].[All], expr)  (MDX doesn't have column-specific ALL)
 * - CALCULATE(expr, ALL('Dim'), col = val) → IIF(col = val, ([dimension_Dim].[Hierarchy].[All], expr), NULL)
 *
 * Supports simple comparison filters: =, <>, >, <, >=, <=, IN
 * Supports ALL() filters for removing dimension filters
 * Does NOT handle:
 * - FILTER() expressions
 * - REMOVEFILTERS/ALLEXCEPT
 * - TREATAS
 * - Relationship functions (RELATED, VALUES, etc.)
 * - Time intelligence functions
 *
 * Confidence: 0.9 for simple filters, 1.0 for no filters, 0.85 for IN/ALL operators
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
      // Reject ALL() filters - AtScale MDX doesn't support tuple syntax in calculations
      // ALL() modifies filter context in DAX, which has no direct MDX equivalent
      if (this.isAllFilter(argGroups[i])) {
        this.warn(`CALCULATE with ALL() filter - AtScale MDX doesn't support tuple syntax in calculations`, context);
        return false;
      }

      const filterCheckResult = this.isSimpleComparisonFilter(argGroups[i], context);
      if (!filterCheckResult.isSimple) {
        this.log(`Rejected: ${filterCheckResult.reason}`, context);
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a token group is an ALL() filter
   * Pattern: ALL('Table') or ALL('Table'[Column]) or ALL(Table)
   */
  private isAllFilter(tokens: DaxToken[]): boolean {
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    return token.functionAgg.toUpperCase() === "ALL";
  }

  /**
   * Convert ALL() filter to MDX [All] member reference
   * ALL('Table') → [dimension_Table].[Hierarchy].[All]
   * ALL('Table'[Column]) → [dimension_Table].[Hierarchy].[All]
   *   (Note: MDX doesn't have column-specific ALL; we use hierarchy [All] member)
   *
   * Uses resolveDimensionHierarchy to look up the actual hierarchy name from
   * converted dimensions or BIM model, avoiding hardcoded naming conventions.
   */
  private convertAllFilter(tokens: DaxToken[], context: ConversionContext): string {
    const funcToken = tokens[0] as FunctionToken;
    const args = funcToken.args;

    if (args.length === 0) {
      throw new Error("ALL() requires at least one argument");
    }

    // Get the first argument (table or table[column] reference)
    const firstArg = args[0];

    if (firstArg instanceof TableColumnReference) {
      const tableName = firstArg.tableName;
      const columnName = firstArg.columnRef?.columnName || "";

      // Use resolveDimensionHierarchy to get actual hierarchy reference
      const hierarchyRef = resolveDimensionHierarchy(tableName, columnName, context.result, context.bim);
      return `${hierarchyRef}.[All]`;
    } else if (firstArg instanceof IdentifierToken) {
      // ALL(Table) without quotes
      const tableName = firstArg.value;

      // Use resolveDimensionHierarchy to get actual hierarchy reference
      const hierarchyRef = resolveDimensionHierarchy(tableName, "", context.result, context.bim);
      return `${hierarchyRef}.[All]`;
    }

    // Fallback: try to extract name from converted expression
    const argMdx = this.convertSubExpression(args, context);
    return `${argMdx}.[All]`;
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
    // Note: ALL is handled specially, so we skip it in this check
    for (let i = 0; i < argGroups.length; i++) {
      if (!this.isAllFilter(argGroups[i]) && this.containsUnconvertibleFunctions(argGroups[i], context)) {
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

      // Separate filters into ALL() filters and comparison filters
      const allFilters: DaxToken[][] = [];
      const comparisonFilters: DaxToken[][] = [];

      for (let i = 1; i < argGroups.length; i++) {
        if (this.isAllFilter(argGroups[i])) {
          allFilters.push(argGroups[i]);
        } else {
          comparisonFilters.push(argGroups[i]);
        }
      }

      // Convert ALL() filters to MDX [All] member references
      const allMemberRefs: string[] = allFilters.map((f) => this.convertAllFilter(f, context));

      // Convert comparison filters
      const filterConditions: string[] = [];
      for (const filterGroup of comparisonFilters) {
        // Check for NOT IN pattern first
        const notInPattern = this.detectNotInPattern(filterGroup);
        if (notInPattern) {
          filterConditions.push(this.convertNotInFilter(notInPattern.innerTokens, context));
        } else {
          const hasIn = filterGroup.some(
            (t) => t instanceof IdentifierToken && t.value.toUpperCase() === "IN"
          );

          if (hasIn) {
            filterConditions.push(this.convertInFilter(filterGroup, context));
          } else {
            filterConditions.push(this.convertSubExpression(filterGroup, context));
          }
        }
      }

      // Build the MDX expression based on filter types
      let mdxExpression: string;
      let method: string;
      let note: string;

      if (allFilters.length > 0 && comparisonFilters.length === 0) {
        // Only ALL() filters: use tuple syntax
        // CALCULATE(expr, ALL('Dim1'), ALL('Dim2')) → ([dimension_Dim1].[Dim1_Hierarchy].[All], [dimension_Dim2].[Dim2_Hierarchy].[All], (expr))
        // Wrap the aggregation in parentheses to ensure it's parsed as a single expression
        const wrappedAgg = `(${aggregationMdx})`;
        const tupleMembers = [...allMemberRefs, wrappedAgg];
        mdxExpression = `(${tupleMembers.join(", ")})`;
        method = "calculate_template_all";
        note = "CALCULATE with ALL filters - converted to tuple with [All] members";
      } else if (allFilters.length > 0 && comparisonFilters.length > 0) {
        // Mixed: ALL() + comparison filters
        // CALCULATE(expr, ALL('Dim'), col = val) → IIF(col = val, ([dimension_Dim].[Dim_Hierarchy].[All], (expr)), NULL)
        const wrappedAgg = `(${aggregationMdx})`;
        const tupleMembers = [...allMemberRefs, wrappedAgg];
        const tupleExpr = `(${tupleMembers.join(", ")})`;
        const combinedFilter = filterConditions.join(" AND ");
        mdxExpression = `IIF(${combinedFilter}, ${tupleExpr}, NULL)`;
        method = "calculate_template_mixed";
        note = "CALCULATE with ALL and comparison filters - IIF with tuple";
      } else {
        // Only comparison filters (original behavior)
        // CALCULATE(agg, filter1, filter2) → IIF(filter1 AND filter2, agg, NULL)
        const combinedFilter = filterConditions.join(" AND ");
        mdxExpression = `IIF(${combinedFilter}, ${aggregationMdx}, NULL)`;
        method = "calculate_template";
        note = "Simple CALCULATE with comparison filters - review context semantics";
      }

      return successfulConversion(
        mdxExpression,
        allFilters.length > 0 ? 0.85 : this.confidence, // Slightly lower confidence for ALL
        ConversionCategory.TEMPLATE_CONVERSION,
        {
          originalDax: `CALCULATE(...)`,
          method,
          filterCount: argGroups.length - 1,
          allFilterCount: allFilters.length,
          comparisonFilterCount: comparisonFilters.length,
          note,
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
   * Detect NOT IN pattern: NOT ( col IN {...} )
   * Returns inner tokens if matches, null otherwise
   */
  private detectNotInPattern(tokens: DaxToken[]): { innerTokens: DaxToken[] } | null {
    if (tokens.length < 2) {
      return null;
    }
    const firstToken = tokens[0];
    if (!(firstToken instanceof IdentifierToken) || firstToken.value.toUpperCase() !== "NOT") {
      return null;
    }
    const secondToken = tokens[1];
    if (!(secondToken instanceof ParenToken)) {
      return null;
    }
    // Check that ParenToken contains IN operator
    const innerTokens = secondToken.args;
    const hasIn = innerTokens.some(t => t instanceof IdentifierToken && t.value.toUpperCase() === "IN");
    if (!hasIn) {
      return null;
    }
    return { innerTokens };
  }

  /**
   * Check if a token group represents a simple comparison filter or IN/NOT IN operator
   * Pattern: column OPERATOR value or column IN {values} or NOT (col IN {values}) or FUNCTION(column) OPERATOR value
   * Supported operators: =, <>, >, <, >=, <=, IN, NOT IN
   *
   * Returns object with isSimple flag and reason for rejection
   */
  private isSimpleComparisonFilter(tokens: DaxToken[], context: ConversionContext): { isSimple: boolean; reason?: string } {
    // Check for fact table column references - these can't be converted to MDX
    // MDX works on aggregated data, not row-level filtering on fact table columns
    for (const token of tokens) {
      if (token instanceof TableColumnReference) {
        const tableName = token.tableName;
        // Check if this table is a fact table (on left side of relationships but not on right)
        const isFactTable = context.bim.model.relationships?.some(
          (rel) => rel.fromTable === tableName
        ) && !context.bim.model.relationships?.some(
          (rel) => rel.toTable === tableName
        );

        if (isFactTable) {
          return {
            isSimple: false,
            reason: `Cannot convert dimension column reference '${tableName}'[${token.columnRef?.columnName || '?'}] - dimension table columns in calculations require the column to be exposed in the dimension hierarchy`
          };
        }
      }
    }
    // Check for NOT IN pattern first
    const notInPattern = this.detectNotInPattern(tokens);
    if (notInPattern) {
      return { isSimple: true }; // NOT IN is supported
    }

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
      return { isSimple: false, reason: "No comparison operator (=, <>, >, <, >=, <=) or IN/NOT IN found" };
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

    // Right side: should contain a BraceToken with values
    const rightTokens = tokens.slice(inIndex + 1);
    const values: string[] = [];

    // Try to extract values from BraceToken first
    for (const token of rightTokens) {
      if (token instanceof BraceToken) {
        for (const arg of token.args) {
          if (arg instanceof LiteralToken) {
            values.push(arg.value);
          } else if (arg instanceof IdentifierToken) {
            values.push(arg.value);
          } else if (!(arg instanceof CommaToken)) {
            // For other token types, convert to string
            values.push(arg.toString());
          }
        }
        break;
      }
    }

    // Fallback: convert to MDX string and parse
    if (values.length === 0) {
      const rightExpr = this.convertSubExpression(rightTokens, context);
      const cleaned = rightExpr.replace(/[{}]/g, "").trim();
      if (cleaned) {
        const parsedValues = cleaned.split(",").map((v) => v.trim()).filter((v) => v.length > 0);
        values.push(...parsedValues);
      }
    }

    if (values.length === 0) {
      return "1 = 0"; // Always false
    }

    // Create OR conditions
    const orConditions = values.map((val) => `${leftExpr} = ${val}`);

    // Return parenthesized OR chain
    return `(${orConditions.join(" OR ")})`;
  }

  /**
   * Convert NOT IN operator expression to AND chain with not-equals
   * Pattern: NOT ( column IN {val1, val2} ) → (column <> val1 AND column <> val2)
   * @param innerTokens - The tokens inside the parentheses (col IN {values})
   */
  private convertNotInFilter(innerTokens: DaxToken[], context: ConversionContext): string {
    // Find the IN keyword position
    let inIndex = -1;
    for (let i = 0; i < innerTokens.length; i++) {
      if (innerTokens[i] instanceof IdentifierToken && innerTokens[i].value.toUpperCase() === "IN") {
        inIndex = i;
        break;
      }
    }

    if (inIndex === -1) {
      throw new Error("IN operator not found in NOT IN filter");
    }

    // Left side: expression before IN
    const leftTokens = innerTokens.slice(0, inIndex);
    const leftExpr = this.convertSubExpression(leftTokens, context);

    // Right side: should contain a BraceToken with values
    const rightTokens = innerTokens.slice(inIndex + 1);
    const values: string[] = [];

    // Try to extract values from BraceToken first
    for (const token of rightTokens) {
      if (token instanceof BraceToken) {
        for (const arg of token.args) {
          if (arg instanceof LiteralToken) {
            values.push(arg.value);
          } else if (arg instanceof IdentifierToken) {
            values.push(arg.value);
          } else if (!(arg instanceof CommaToken)) {
            values.push(arg.toString());
          }
        }
        break;
      }
    }

    // Fallback: convert to MDX string and parse
    if (values.length === 0) {
      const rightExpr = this.convertSubExpression(rightTokens, context);
      const cleaned = rightExpr.replace(/[{}]/g, "").trim();
      if (cleaned) {
        const parsedValues = cleaned.split(",").map((v) => v.trim()).filter((v) => v.length > 0);
        values.push(...parsedValues);
      }
    }

    if (values.length === 0) {
      return "1 = 1"; // Always true for empty NOT IN
    }

    // Create AND conditions with not-equals
    const andConditions = values.map((val) => `${leftExpr} <> ${val}`);

    // Return parenthesized AND chain
    return `(${andConditions.join(" AND ")})`;
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
      {
        dax: "CALCULATE([Measure], ALL('Dimension'))",
        mdx: "([Dimension].[Dimension].[All], [Measure])",
        description: "ALL filter - removes dimension filter using tuple",
      },
      {
        dax: "CALCULATE([Measure], ALL('Dim1'), ALL('Dim2'))",
        mdx: "([dimension_Dim1].[Hierarchy].[All], [dimension_Dim2].[Hierarchy].[All], [Measure])",
        description: "Multiple ALL filters - tuple with multiple [All] members (hierarchy names resolved dynamically)",
      },
      {
        dax: 'CALCULATE([Measure], ALL(\'Dimension\'), [Status] = "Active")',
        mdx: 'IIF([Status] = "Active", ([Dimension].[Dimension].[All], [Measure]), NULL)',
        description: "Mixed ALL and comparison filters",
      },
      {
        dax: 'CALCULATE(SUM([Sales]), NOT ( [Category] IN {"X", "Y"} ))',
        mdx: 'IIF(([Category] <> "X" AND [Category] <> "Y"), SUM([Sales]), NULL)',
        description: "NOT IN operator with multiple values",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts simple DAX CALCULATE expressions to MDX. " +
      "Supports: (1) CALCULATE with no filters → unwraps to inner expression, " +
      "(2) CALCULATE with simple comparison filters → IIF with conditions, " +
      "(3) CALCULATE with IN operator → IIF with OR chain, " +
      "(4) CALCULATE with NOT IN operator → IIF with AND chain of <>, " +
      "(5) CALCULATE with ALL() → tuple with [All] members. " +
      "Supports comparison operators: =, <>, >, <, >=, <=. " +
      "Supports IN operator: column IN {val1, val2} → (column = val1 OR column = val2). " +
      "Supports NOT IN: NOT (column IN {val1, val2}) → (column <> val1 AND column <> val2). " +
      "Supports ALL(): ALL('Table') → tuple with [dimension_Table].[Hierarchy].[All] member (hierarchy resolved dynamically). " +
      "Does not handle: FILTER(), ALLEXCEPT, TREATAS, time intelligence, or relationship functions. " +
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
