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
import { resolveDimensionHierarchy, extractDimUniqueName, resolveTimeLevelByUnit } from "../../converter-utils";

/**
 * ParallelPeriodTemplate converts DAX PARALLELPERIOD function to MDX.
 *
 * DAX: CALCULATE([Total Sales], PARALLELPERIOD(DATE_DIM[D_DATE], -1, YEAR))
 * MDX: (ParallelPeriod([dimension.DATE_DIM].[DATE_DIM Hierarchy].[Year], 1, [dimension.DATE_DIM].[DATE_DIM Hierarchy].CurrentMember), [Measures].[Total Sales])
 *
 * PARALLELPERIOD returns a set of dates shifted by a specified number of intervals.
 * The DAX offset is negated for MDX (DAX -1 = MDX 1 to go back in time).
 */
export class ParallelPeriodTemplate extends ConversionTemplate {
  readonly name = "ParallelPeriodTemplate";
  readonly confidence = 0.9;

  // Map DAX interval names to time unit types
  private readonly intervalToTimeUnit: Record<string, "year" | "quarter" | "month" | "day"> = {
    YEAR: "year",
    QUARTER: "quarter",
    MONTH: "month",
    DAY: "day",
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

    // Handle CALCULATE(measure, PARALLELPERIOD(...))
    if (funcName === "CALCULATE") {
      return this.isCalculateWithParallelPeriod(token, context);
    }

    // Handle standalone PARALLELPERIOD (less common but supported)
    if (funcName === "PARALLELPERIOD") {
      const argCount = this.countArguments(token.args);
      if (argCount < 3) {
        this.warn(
          `PARALLELPERIOD function has ${argCount} arguments, expected 3`,
          context,
        );
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Check if this is CALCULATE([measure], PARALLELPERIOD(...))
   */
  private isCalculateWithParallelPeriod(
    token: FunctionToken,
    context: ConversionContext,
  ): boolean {
    const argGroups = this.splitArguments(token.args);

    if (argGroups.length < 2) {
      return false;
    }

    // Check if any argument is PARALLELPERIOD
    for (let i = 1; i < argGroups.length; i++) {
      const filterArg = argGroups[i];
      if (filterArg.length === 1 && filterArg[0] instanceof FunctionToken) {
        const filterFunc = filterArg[0] as FunctionToken;
        if (filterFunc.functionAgg.toUpperCase() === "PARALLELPERIOD") {
          // Check for unconvertible functions in the measure argument
          if (this.containsUnconvertibleFunctions(argGroups[0], context)) {
            this.warn(
              `CALCULATE with PARALLELPERIOD - measure argument contains unconvertible functions`,
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
        return this.convertCalculateWithParallelPeriod(token, context);
      } else if (funcName === "PARALLELPERIOD") {
        return this.convertStandaloneParallelPeriod(token, context);
      }

      return failedConversion(
        `Unexpected function in ParallelPeriodTemplate: ${funcName}`,
        token.functionAgg,
      );
    } catch (error) {
      return failedConversion(
        `Failed to convert PARALLELPERIOD: ${error instanceof Error ? error.message : String(error)}`,
        token.functionAgg,
      );
    }
  }

  /**
   * Convert CALCULATE([measure], PARALLELPERIOD(DATE_DIM[D_DATE], -1, YEAR))
   */
  private convertCalculateWithParallelPeriod(
    token: FunctionToken,
    context: ConversionContext,
  ): ConversionResult {
    const argGroups = this.splitArguments(token.args);

    // First argument: the measure expression
    const measureMdx = this.convertSubExpression(argGroups[0], context);

    // Find the PARALLELPERIOD argument
    for (let i = 1; i < argGroups.length; i++) {
      const filterArg = argGroups[i];
      if (filterArg.length === 1 && filterArg[0] instanceof FunctionToken) {
        const filterFunc = filterArg[0] as FunctionToken;
        if (filterFunc.functionAgg.toUpperCase() === "PARALLELPERIOD") {
          const parallelPeriodArgs = this.splitArguments(filterFunc.args);

          if (parallelPeriodArgs.length < 3) {
            return failedConversion(
              `PARALLELPERIOD requires 3 arguments, got ${parallelPeriodArgs.length}`,
              token.functionAgg,
            );
          }

          // Extract date column reference
          const dimensionRef = this.extractDimensionReference(
            parallelPeriodArgs[0],
            context,
          );

          if (!dimensionRef) {
            return failedConversion(
              `PARALLELPERIOD could not resolve dimension reference from date column`,
              token.functionAgg,
            );
          }

          // Extract offset (negate for MDX - DAX -1 means go back, MDX 1 means go back)
          const offset = this.extractOffset(parallelPeriodArgs[1]);
          if (offset === undefined) {
            return failedConversion(
              `PARALLELPERIOD could not parse offset from second argument`,
              token.functionAgg,
            );
          }
          const mdxOffset = Math.abs(offset);

          // Extract interval (YEAR, QUARTER, MONTH, DAY)
          const interval = this.extractInterval(parallelPeriodArgs[2]);
          if (!interval) {
            return failedConversion(
              `PARALLELPERIOD could not parse interval from third argument`,
              token.functionAgg,
            );
          }

          const timeUnit = this.intervalToTimeUnit[interval];
          if (!timeUnit) {
            return failedConversion(
              `PARALLELPERIOD unsupported interval: ${interval}`,
              token.functionAgg,
            );
          }

          // Resolve the actual level name from the dimension
          const dimUniqueName = extractDimUniqueName(dimensionRef);
          const mdxLevel = dimUniqueName
            ? resolveTimeLevelByUnit(dimUniqueName, timeUnit, context.result, context.bim)
            : interval.charAt(0).toUpperCase() + interval.slice(1).toLowerCase();

          // Build MDX: (ParallelPeriod([dim].[hier].[Level], offset, [dim].[hier].CurrentMember), [Measures].[measure])
          const mdxExpression = `(ParallelPeriod(${dimensionRef}.[${mdxLevel}], ${mdxOffset}, ${dimensionRef}.CurrentMember), ${measureMdx})`;

          return successfulConversion(
            mdxExpression,
            this.confidence,
            ConversionCategory.TEMPLATE_CONVERSION,
            {
              originalDax: `CALCULATE(..., PARALLELPERIOD(...))`,
              method: "parallelperiod_template",
              note: `Parallel period shifted by ${mdxOffset} ${mdxLevel}(s)`,
            },
          );
        }
      }
    }

    return failedConversion(
      `Could not find PARALLELPERIOD in CALCULATE arguments`,
      token.functionAgg,
    );
  }

  /**
   * Convert standalone PARALLELPERIOD(DATE_DIM[D_DATE], -1, YEAR)
   * Returns just the ParallelPeriod set
   */
  private convertStandaloneParallelPeriod(
    token: FunctionToken,
    context: ConversionContext,
  ): ConversionResult {
    const argGroups = this.splitArguments(token.args);

    if (argGroups.length < 3) {
      return failedConversion(
        `PARALLELPERIOD requires 3 arguments, got ${argGroups.length}`,
        token.functionAgg,
      );
    }

    const dimensionRef = this.extractDimensionReference(argGroups[0], context);

    if (!dimensionRef) {
      return failedConversion(
        `PARALLELPERIOD could not resolve dimension reference from date column`,
        token.functionAgg,
      );
    }

    const offset = this.extractOffset(argGroups[1]);
    if (offset === undefined) {
      return failedConversion(
        `PARALLELPERIOD could not parse offset from second argument`,
        token.functionAgg,
      );
    }
    const mdxOffset = Math.abs(offset);

    const interval = this.extractInterval(argGroups[2]);
    if (!interval) {
      return failedConversion(
        `PARALLELPERIOD could not parse interval from third argument`,
        token.functionAgg,
      );
    }

    const timeUnit = this.intervalToTimeUnit[interval];
    if (!timeUnit) {
      return failedConversion(
        `PARALLELPERIOD unsupported interval: ${interval}`,
        token.functionAgg,
      );
    }

    // Resolve the actual level name from the dimension
    const dimUniqueName = extractDimUniqueName(dimensionRef);
    const mdxLevel = dimUniqueName
      ? resolveTimeLevelByUnit(dimUniqueName, timeUnit, context.result, context.bim)
      : interval.charAt(0).toUpperCase() + interval.slice(1).toLowerCase();

    // For standalone, return the ParallelPeriod expression
    const mdxExpression = `ParallelPeriod(${dimensionRef}.[${mdxLevel}], ${mdxOffset}, ${dimensionRef}.CurrentMember)`;

    return successfulConversion(
      mdxExpression,
      this.confidence,
      ConversionCategory.TEMPLATE_CONVERSION,
      {
        originalDax: `PARALLELPERIOD(...)`,
        method: "parallelperiod_template",
        note: `Parallel period shifted by ${mdxOffset} ${mdxLevel}(s)`,
      },
    );
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
        if (this.intervalToTimeUnit[interval]) {
          return interval;
        }
      }
    }

    // Fallback: try parsing from string
    const tokenStr = tokens.map((t) => t.toString()).join("").trim().toUpperCase();

    // Check if it's a known interval
    if (this.intervalToTimeUnit[tokenStr]) {
      return tokenStr;
    }

    return undefined;
  }

  getExamples(): ConversionExample[] {
    return [
      {
        dax: "CALCULATE([Total Sales], PARALLELPERIOD(DATE_DIM[D_DATE], -1, YEAR))",
        mdx: "(ParallelPeriod([dimension.DATE_DIM].[DATE_DIM Hierarchy].[Year], 1, [dimension.DATE_DIM].[DATE_DIM Hierarchy].CurrentMember), [Measures].[Total Sales])",
        description: "Sales from the parallel period one year ago",
      },
      {
        dax: "PARALLELPERIOD('Date'[Date], -1, QUARTER)",
        mdx: "ParallelPeriod([dimension.Date].[Date Hierarchy].[Quarter], 1, [dimension.Date].[Date Hierarchy].CurrentMember)",
        description: "Standalone parallel period one quarter ago",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX PARALLELPERIOD function to MDX ParallelPeriod pattern. " +
      "Maps DAX intervals (YEAR, QUARTER, MONTH, DAY) to MDX hierarchy levels. " +
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
