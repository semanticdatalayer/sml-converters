import {
  ConversionTemplate,
  ConversionExample,
} from "../template-base";
import { DaxToken, FunctionToken, CommaToken, TableColumnReference } from "../../dax-converter";
import {
  ConversionResult,
  ConversionCategory,
  successfulConversion,
  failedConversion,
} from "../../conversion-result";
import { ConversionContext } from "../conversion-context";
import { resolveDimensionHierarchy } from "../../converter-utils";

/**
 * TotalQtdTemplate converts DAX TOTALQTD function to MDX.
 *
 * DAX: TOTALQTD([Total Sales], DATE_DIM[D_DATE])
 * MDX: Sum(QTD([dimension.DATE_DIM].[DATE_DIM Hierarchy].CurrentMember), [Measures].[Total Sales])
 *
 * TOTALQTD evaluates an expression for the quarter-to-date value.
 */
export class TotalQtdTemplate extends ConversionTemplate {
  readonly name = "TotalQtdTemplate";
  readonly confidence = 0.95;

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    if (token.functionAgg.toUpperCase() !== "TOTALQTD") {
      return false;
    }

    const argCount = this.countArguments(token.args);
    // TOTALQTD requires at least 2 arguments: expression and dates column
    // Optional 3rd argument: filter (year_end_date)
    if (argCount < 2) {
      this.warn(
        `TOTALQTD function has ${argCount} arguments, expected at least 2`,
        context,
      );
      return false;
    }

    // Check for unconvertible functions in the expression argument
    const argGroups = this.splitArguments(token.args);
    if (argGroups.length > 0 && this.containsUnconvertibleFunctions(argGroups[0], context)) {
      this.warn(
        `TOTALQTD expression argument contains unconvertible functions - rejecting conversion`,
        context,
      );
      return false;
    }

    return true;
  }

  convert(tokens: DaxToken[], context: ConversionContext): ConversionResult {
    const token = tokens[0] as FunctionToken;
    const args = token.args;

    const argGroups = this.splitArguments(args);

    if (argGroups.length < 2) {
      return failedConversion(
        `TOTALQTD requires at least 2 arguments, got ${argGroups.length}`,
        token.functionAgg,
      );
    }

    try {
      // First argument: the measure expression
      const measureMdx = this.convertSubExpression(argGroups[0], context);

      // Second argument: the date column (e.g., DATE_DIM[D_DATE])
      const dateColumnTokens = argGroups[1];
      const dimensionRef = this.extractDimensionReference(dateColumnTokens, context);

      if (!dimensionRef) {
        return failedConversion(
          `TOTALQTD could not resolve dimension reference from date column`,
          token.functionAgg,
        );
      }

      // Build MDX: Sum(QTD([dimension].[hierarchy].CurrentMember), [Measures].[measure])
      const mdxExpression = `Sum(QTD(${dimensionRef}.CurrentMember), ${measureMdx})`;

      return successfulConversion(
        mdxExpression,
        this.confidence,
        ConversionCategory.TEMPLATE_CONVERSION,
        {
          originalDax: `TOTALQTD(...)`,
          method: "totalqtd_template",
          note: "Quarter-to-date aggregation",
        },
      );
    } catch (error) {
      return failedConversion(
        `Failed to convert TOTALQTD: ${error instanceof Error ? error.message : String(error)}`,
        token.functionAgg,
      );
    }
  }

  /**
   * Extract dimension hierarchy reference from date column tokens
   * E.g., DATE_DIM[D_DATE] → [dimension.DATE_DIM].[DATE_DIM Hierarchy]
   */
  private extractDimensionReference(
    tokens: DaxToken[],
    context: ConversionContext,
  ): string | undefined {
    for (const token of tokens) {
      if (token instanceof TableColumnReference) {
        const tableName = token.tableName;
        const columnName = token.columnRef?.columnName || "";
        return resolveDimensionHierarchy(tableName, columnName, context.result);
      }
    }

    // Fallback: try to parse from token string representation
    const tokenStr = tokens.map(t => t.toString()).join("");
    const match = tokenStr.match(/['"]?(\w+)['"]?\[(\w+)\]/);
    if (match) {
      const tableName = match[1];
      const columnName = match[2];
      return resolveDimensionHierarchy(tableName, columnName, context.result);
    }

    return undefined;
  }

  getExamples(): ConversionExample[] {
    return [
      {
        dax: "TOTALQTD([Total Sales], DATE_DIM[D_DATE])",
        mdx: "Sum(QTD([dimension.DATE_DIM].[DATE_DIM Hierarchy].CurrentMember), [Measures].[Total Sales])",
        description: "Quarter-to-date sales calculation",
      },
      {
        dax: "TOTALQTD(SUM(Sales[Amount]), 'Date'[Date])",
        mdx: "Sum(QTD([dimension.Date].[Date Hierarchy].CurrentMember), [Measures].[Amount_sum])",
        description: "QTD with aggregation expression",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX TOTALQTD function to MDX Sum(QTD()) pattern. " +
      "Maps dimension column reference to MDX hierarchy using resolveDimensionHierarchy."
    );
  }

  private countArguments(args: DaxToken[]): number {
    let count = args.length > 0 ? 1 : 0;
    for (const token of args) {
      if (token instanceof CommaToken) {
        count++;
      }
    }
    return count;
  }

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
}
