import {
  ConversionTemplate,
  ConversionExample,
} from "../template-base";
import { DaxToken, FunctionToken, CommaToken, TableColumnReference, LiteralToken, OperatorToken, IdentifierToken } from "../../dax-converter";
import {
  ConversionResult,
  ConversionCategory,
  successfulConversion,
  failedConversion,
} from "../../conversion-result";
import { ConversionContext } from "../conversion-context";
import { resolveDimensionHierarchy } from "../../converter-utils";

/**
 * DateAddTemplate converts DAX DATEADD function to MDX.
 *
 * DAX: CALCULATE([Total Sales], DATEADD(DATE_DIM[D_DATE], -7, DAY))
 * MDX: ([dimension.DATE_DIM].[DATE_DIM Hierarchy].CurrentMember.Lag(7), [Measures].[Total Sales])
 *
 * DATEADD shifts dates by a specified number of intervals.
 * Negative offsets in DAX mean "go back in time", which maps to Lag() in MDX.
 * Positive offsets in DAX mean "go forward in time", which maps to Lead() in MDX.
 */
export class DateAddTemplate extends ConversionTemplate {
  readonly name = "DateAddTemplate";
  readonly confidence = 0.9;

  // Map DAX interval names to MDX hierarchy level names
  private readonly intervalToLevel: Record<string, string> = {
    YEAR: "Year",
    QUARTER: "Quarter",
    MONTH: "Month",
    DAY: "Day",
  };

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    const funcName = token.functionAgg.toUpperCase();

    // Handle CALCULATE(measure, DATEADD(...))
    if (funcName === "CALCULATE") {
      return this.isCalculateWithDateAdd(token, context);
    }

    // Handle standalone DATEADD (less common but supported)
    if (funcName === "DATEADD") {
      const argCount = this.countArguments(token.args);
      if (argCount < 3) {
        this.warn(
          `DATEADD function has ${argCount} arguments, expected 3`,
          context,
        );
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Check if this is CALCULATE([measure], DATEADD(...))
   */
  private isCalculateWithDateAdd(
    token: FunctionToken,
    context: ConversionContext,
  ): boolean {
    const argGroups = this.splitArguments(token.args);

    if (argGroups.length < 2) {
      return false;
    }

    // Check if any argument is DATEADD
    for (let i = 1; i < argGroups.length; i++) {
      const filterArg = argGroups[i];
      if (filterArg.length === 1 && filterArg[0] instanceof FunctionToken) {
        const filterFunc = filterArg[0] as FunctionToken;
        if (filterFunc.functionAgg.toUpperCase() === "DATEADD") {
          // Check for unconvertible functions in the measure argument
          if (this.containsUnconvertibleFunctions(argGroups[0], context)) {
            this.warn(
              `CALCULATE with DATEADD - measure argument contains unconvertible functions`,
              context,
            );
            return false;
          }
          return true;
        }
      }
    }

    return false;
  }

  convert(tokens: DaxToken[], context: ConversionContext): ConversionResult {
    const token = tokens[0] as FunctionToken;
    const funcName = token.functionAgg.toUpperCase();

    try {
      if (funcName === "CALCULATE") {
        return this.convertCalculateWithDateAdd(token, context);
      } else if (funcName === "DATEADD") {
        return this.convertStandaloneDateAdd(token, context);
      }

      return failedConversion(
        `Unexpected function in DateAddTemplate: ${funcName}`,
        token.functionAgg,
      );
    } catch (error) {
      return failedConversion(
        `Failed to convert DATEADD: ${error instanceof Error ? error.message : String(error)}`,
        token.functionAgg,
      );
    }
  }

  /**
   * Convert CALCULATE([measure], DATEADD(DATE_DIM[D_DATE], -7, DAY))
   */
  private convertCalculateWithDateAdd(
    token: FunctionToken,
    context: ConversionContext,
  ): ConversionResult {
    const argGroups = this.splitArguments(token.args);

    // First argument: the measure expression
    const measureMdx = this.convertSubExpression(argGroups[0], context);

    // Find the DATEADD argument
    for (let i = 1; i < argGroups.length; i++) {
      const filterArg = argGroups[i];
      if (filterArg.length === 1 && filterArg[0] instanceof FunctionToken) {
        const filterFunc = filterArg[0] as FunctionToken;
        if (filterFunc.functionAgg.toUpperCase() === "DATEADD") {
          const dateAddArgs = this.splitArguments(filterFunc.args);

          if (dateAddArgs.length < 3) {
            return failedConversion(
              `DATEADD requires 3 arguments, got ${dateAddArgs.length}`,
              token.functionAgg,
            );
          }

          // Extract date column reference
          const dimensionRef = this.extractDimensionReference(
            dateAddArgs[0],
            context,
          );

          if (!dimensionRef) {
            return failedConversion(
              `DATEADD could not resolve dimension reference from date column`,
              token.functionAgg,
            );
          }

          // Extract offset
          const offset = this.extractOffset(dateAddArgs[1]);
          if (offset === undefined) {
            return failedConversion(
              `DATEADD could not parse offset from second argument`,
              token.functionAgg,
            );
          }

          // Extract interval (YEAR, QUARTER, MONTH, DAY)
          const interval = this.extractInterval(dateAddArgs[2]);
          if (!interval) {
            return failedConversion(
              `DATEADD could not parse interval from third argument`,
              token.functionAgg,
            );
          }

          const mdxLevel = this.intervalToLevel[interval];
          if (!mdxLevel) {
            return failedConversion(
              `DATEADD unsupported interval: ${interval}`,
              token.functionAgg,
            );
          }

          // Build MDX expression using Lag (negative offset) or Lead (positive offset)
          const mdxExpression = this.buildMdxExpression(dimensionRef, offset, measureMdx);

          return successfulConversion(
            mdxExpression,
            this.confidence,
            ConversionCategory.TEMPLATE_CONVERSION,
            {
              originalDax: `CALCULATE(..., DATEADD(...))`,
              method: "dateadd_template",
              note: `Date shifted by ${offset} ${interval}(s)`,
            },
          );
        }
      }
    }

    return failedConversion(
      `Could not find DATEADD in CALCULATE arguments`,
      token.functionAgg,
    );
  }

  /**
   * Convert standalone DATEADD(DATE_DIM[D_DATE], -7, DAY)
   * Returns just the Lag/Lead expression
   */
  private convertStandaloneDateAdd(
    token: FunctionToken,
    context: ConversionContext,
  ): ConversionResult {
    const argGroups = this.splitArguments(token.args);

    if (argGroups.length < 3) {
      return failedConversion(
        `DATEADD requires 3 arguments, got ${argGroups.length}`,
        token.functionAgg,
      );
    }

    const dimensionRef = this.extractDimensionReference(argGroups[0], context);

    if (!dimensionRef) {
      return failedConversion(
        `DATEADD could not resolve dimension reference from date column`,
        token.functionAgg,
      );
    }

    const offset = this.extractOffset(argGroups[1]);
    if (offset === undefined) {
      return failedConversion(
        `DATEADD could not parse offset from second argument`,
        token.functionAgg,
      );
    }

    const interval = this.extractInterval(argGroups[2]);
    if (!interval) {
      return failedConversion(
        `DATEADD could not parse interval from third argument`,
        token.functionAgg,
      );
    }

    const mdxLevel = this.intervalToLevel[interval];
    if (!mdxLevel) {
      return failedConversion(
        `DATEADD unsupported interval: ${interval}`,
        token.functionAgg,
      );
    }

    // For standalone, return just the Lag/Lead expression
    const absOffset = Math.abs(offset);
    const mdxFunc = offset < 0 ? "Lag" : "Lead";
    const mdxExpression = `${dimensionRef}.CurrentMember.${mdxFunc}(${absOffset})`;

    return successfulConversion(
      mdxExpression,
      this.confidence,
      ConversionCategory.TEMPLATE_CONVERSION,
      {
        originalDax: `DATEADD(...)`,
        method: "dateadd_template",
        note: `Date shifted by ${offset} ${interval}(s)`,
      },
    );
  }

  /**
   * Build MDX expression with proper Lag/Lead based on offset sign
   */
  private buildMdxExpression(dimensionRef: string, offset: number, measureMdx: string): string {
    const absOffset = Math.abs(offset);
    // Negative offset in DAX = go back in time = Lag in MDX
    // Positive offset in DAX = go forward in time = Lead in MDX
    const mdxFunc = offset < 0 ? "Lag" : "Lead";
    return `(${dimensionRef}.CurrentMember.${mdxFunc}(${absOffset}), ${measureMdx})`;
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
        return resolveDimensionHierarchy(tableName, columnName, context.result, context.bim);
      }
    }

    // Fallback: try to parse from token string representation
    const tokenStr = tokens.map((t) => t.toString()).join("");
    const match = tokenStr.match(/['"]?(\w+)['"]?\[(\w+)\]/);
    if (match) {
      const tableName = match[1];
      const columnName = match[2];
      return resolveDimensionHierarchy(tableName, columnName, context.result, context.bim);
    }

    return undefined;
  }

  /**
   * Extract numeric offset from tokens
   * Handles both positive and negative numbers
   */
  private extractOffset(tokens: DaxToken[]): number | undefined {
    let isNegative = false;

    for (const token of tokens) {
      if (token instanceof OperatorToken && token.value === "-") {
        isNegative = true;
      } else if (token instanceof LiteralToken) {
        const value = parseFloat(token.value);
        if (!isNaN(value)) {
          return isNegative ? -value : value;
        }
      }
    }

    // Fallback: try parsing from string
    const tokenStr = tokens.map((t) => t.toString()).join("").trim();
    const parsed = parseFloat(tokenStr);
    if (!isNaN(parsed)) {
      return parsed;
    }

    return undefined;
  }

  /**
   * Extract interval name from tokens
   */
  private extractInterval(tokens: DaxToken[]): string | undefined {
    // First try to find an identifier token (YEAR, MONTH, etc.)
    for (const token of tokens) {
      if (token instanceof IdentifierToken) {
        const interval = token.value.toUpperCase();
        if (this.intervalToLevel[interval]) {
          return interval;
        }
      }
    }

    // Fallback: try parsing from string
    const tokenStr = tokens.map((t) => t.toString()).join("").trim().toUpperCase();

    // Check if it's a known interval
    if (this.intervalToLevel[tokenStr]) {
      return tokenStr;
    }

    return undefined;
  }

  getExamples(): ConversionExample[] {
    return [
      {
        dax: "CALCULATE([Total Sales], DATEADD(DATE_DIM[D_DATE], -7, DAY))",
        mdx: "([dimension.DATE_DIM].[DATE_DIM Hierarchy].CurrentMember.Lag(7), [Measures].[Total Sales])",
        description: "Sales from 7 days ago",
      },
      {
        dax: "CALCULATE([Total Sales], DATEADD(DATE_DIM[D_DATE], -1, MONTH))",
        mdx: "([dimension.DATE_DIM].[DATE_DIM Hierarchy].CurrentMember.Lag(1), [Measures].[Total Sales])",
        description: "Sales from 1 month ago",
      },
      {
        dax: "DATEADD('Date'[Date], 1, YEAR)",
        mdx: "[dimension.Date].[Date Hierarchy].CurrentMember.Lead(1)",
        description: "Standalone date add one year forward",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX DATEADD function to MDX Lag/Lead pattern. " +
      "Maps DAX intervals (YEAR, QUARTER, MONTH, DAY) to MDX hierarchy levels. " +
      "Negative offsets use Lag, positive offsets use Lead. " +
      "Handles both standalone and CALCULATE-wrapped usage."
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
