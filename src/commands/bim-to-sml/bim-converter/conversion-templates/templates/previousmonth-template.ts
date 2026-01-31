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
import { resolveDimensionHierarchy, extractDimUniqueName, resolveTimeLevelByUnit } from "../../converter-utils";

/**
 * PreviousMonthTemplate converts DAX PREVIOUSMONTH function to MDX.
 *
 * DAX: CALCULATE([Total Sales], PREVIOUSMONTH(DATE_DIM[D_DATE]))
 * MDX: (ParallelPeriod([dimension.DATE_DIM].[DATE_DIM Hierarchy].[Month], 1, [dimension.DATE_DIM].[DATE_DIM Hierarchy].CurrentMember), [Measures].[Total Sales])
 *
 * PREVIOUSMONTH returns a set of dates from the previous month.
 * In MDX, ParallelPeriod at the month level achieves the same result.
 */
export class PreviousMonthTemplate extends ConversionTemplate {
  readonly name = "PreviousMonthTemplate";
  readonly confidence = 0.9;

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    const funcName = token.functionAgg.toUpperCase();

    // Handle CALCULATE(measure, PREVIOUSMONTH(...))
    if (funcName === "CALCULATE") {
      return this.isCalculateWithPreviousMonth(token, context);
    }

    // Handle standalone PREVIOUSMONTH (less common but supported)
    if (funcName === "PREVIOUSMONTH") {
      const argCount = this.countArguments(token.args);
      if (argCount < 1) {
        this.warn(
          `PREVIOUSMONTH function has ${argCount} arguments, expected at least 1`,
          context,
        );
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Check if this is CALCULATE([measure], PREVIOUSMONTH(...))
   */
  private isCalculateWithPreviousMonth(
    token: FunctionToken,
    context: ConversionContext,
  ): boolean {
    const argGroups = this.splitArguments(token.args);

    if (argGroups.length < 2) {
      return false;
    }

    // Check if any argument is PREVIOUSMONTH
    for (let i = 1; i < argGroups.length; i++) {
      const filterArg = argGroups[i];
      if (filterArg.length === 1 && filterArg[0] instanceof FunctionToken) {
        const filterFunc = filterArg[0] as FunctionToken;
        if (filterFunc.functionAgg.toUpperCase() === "PREVIOUSMONTH") {
          // Check for unconvertible functions in the measure argument
          if (this.containsUnconvertibleFunctions(argGroups[0], context)) {
            this.warn(
              `CALCULATE with PREVIOUSMONTH - measure argument contains unconvertible functions`,
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
        return this.convertCalculateWithPreviousMonth(token, context);
      } else if (funcName === "PREVIOUSMONTH") {
        return this.convertStandalonePreviousMonth(token, context);
      }

      return failedConversion(
        `Unexpected function in PreviousMonthTemplate: ${funcName}`,
        token.functionAgg,
      );
    } catch (error) {
      return failedConversion(
        `Failed to convert PREVIOUSMONTH: ${error instanceof Error ? error.message : String(error)}`,
        token.functionAgg,
      );
    }
  }

  /**
   * Convert CALCULATE([measure], PREVIOUSMONTH(DATE_DIM[D_DATE]))
   */
  private convertCalculateWithPreviousMonth(
    token: FunctionToken,
    context: ConversionContext,
  ): ConversionResult {
    const argGroups = this.splitArguments(token.args);

    // First argument: the measure expression
    const measureMdx = this.convertSubExpression(argGroups[0], context);

    // Find the PREVIOUSMONTH argument
    for (let i = 1; i < argGroups.length; i++) {
      const filterArg = argGroups[i];
      if (filterArg.length === 1 && filterArg[0] instanceof FunctionToken) {
        const filterFunc = filterArg[0] as FunctionToken;
        if (filterFunc.functionAgg.toUpperCase() === "PREVIOUSMONTH") {
          const dateColumnTokens = filterFunc.args.filter(
            (t) => !(t instanceof CommaToken),
          );
          const dimensionRef = this.extractDimensionReference(
            dateColumnTokens,
            context,
          );

          if (!dimensionRef) {
            return failedConversion(
              `PREVIOUSMONTH could not resolve dimension reference from date column`,
              token.functionAgg,
            );
          }

          // Resolve the actual month level name from the dimension
          const dimUniqueName = extractDimUniqueName(dimensionRef);
          const monthLevel = dimUniqueName
            ? resolveTimeLevelByUnit(dimUniqueName, "month", context.result, context.bim)
            : undefined;

          // ParallelPeriod requires a month level to exist in the dimension hierarchy
          if (!monthLevel) {
            return failedConversion(
              `PREVIOUSMONTH requires Month level in dimension hierarchy, but ${dimUniqueName || "unknown dimension"} has no Month level`,
              token.functionAgg,
            );
          }

          // Validate that the month level exists in the dimension hierarchy
          if (!this.levelExistsInDimension(dimUniqueName, monthLevel, context)) {
            return failedConversion(
              `PREVIOUSMONTH requires hierarchy level '${monthLevel}' but dimension has flat structure - time intelligence patterns require multi-level hierarchies`,
              token.functionAgg,
            );
          }

          // Build MDX: (ParallelPeriod([dim].[hier].[Month], 1, [dim].[hier].CurrentMember), [Measures].[measure])
          const mdxExpression = `(ParallelPeriod(${dimensionRef}.[${monthLevel}], 1, ${dimensionRef}.CurrentMember), ${measureMdx})`;

          return successfulConversion(
            mdxExpression,
            this.confidence,
            ConversionCategory.TEMPLATE_CONVERSION,
            {
              originalDax: `CALCULATE(..., PREVIOUSMONTH(...))`,
              method: "previousmonth_template",
              note: "Previous month using ParallelPeriod",
            },
          );
        }
      }
    }

    return failedConversion(
      `Could not find PREVIOUSMONTH in CALCULATE arguments`,
      token.functionAgg,
    );
  }

  /**
   * Convert standalone PREVIOUSMONTH(DATE_DIM[D_DATE])
   * Returns just the Lag(1) expression
   */
  private convertStandalonePreviousMonth(
    token: FunctionToken,
    context: ConversionContext,
  ): ConversionResult {
    const dateColumnTokens = token.args.filter((t) => !(t instanceof CommaToken));
    const dimensionRef = this.extractDimensionReference(dateColumnTokens, context);

    if (!dimensionRef) {
      return failedConversion(
        `PREVIOUSMONTH could not resolve dimension reference from date column`,
        token.functionAgg,
      );
    }

    // Resolve the actual month level name from the dimension
    const dimUniqueName = extractDimUniqueName(dimensionRef);
    const monthLevel = dimUniqueName
      ? resolveTimeLevelByUnit(dimUniqueName, "month", context.result, context.bim)
      : undefined;

    // ParallelPeriod requires a month level to exist in the dimension hierarchy
    if (!monthLevel) {
      return failedConversion(
        `PREVIOUSMONTH requires Month level in dimension hierarchy, but ${dimUniqueName || "unknown dimension"} has no Month level`,
        token.functionAgg,
      );
    }

    // Validate that the month level exists in the dimension hierarchy
    if (!this.levelExistsInDimension(dimUniqueName, monthLevel, context)) {
      return failedConversion(
        `PREVIOUSMONTH requires hierarchy level '${monthLevel}' but dimension has flat structure - time intelligence patterns require multi-level hierarchies`,
        token.functionAgg,
      );
    }

    // For standalone, return the ParallelPeriod expression
    const mdxExpression = `ParallelPeriod(${dimensionRef}.[${monthLevel}], 1, ${dimensionRef}.CurrentMember)`;

    return successfulConversion(
      mdxExpression,
      this.confidence,
      ConversionCategory.TEMPLATE_CONVERSION,
      {
        originalDax: `PREVIOUSMONTH(...)`,
        method: "previousmonth_template",
        note: "Previous month using ParallelPeriod",
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

  getExamples(): ConversionExample[] {
    return [
      {
        dax: "CALCULATE([Total Sales], PREVIOUSMONTH(DATE_DIM[D_DATE]))",
        mdx: "(ParallelPeriod([dimension.DATE_DIM].[DATE_DIM Hierarchy].[Month], 1, [dimension.DATE_DIM].[DATE_DIM Hierarchy].CurrentMember), [Measures].[Total Sales])",
        description: "Sales from the previous month",
      },
      {
        dax: "PREVIOUSMONTH('Date'[Date])",
        mdx: "ParallelPeriod([dimension.Date].[Date Hierarchy].[Month], 1, [dimension.Date].[Date Hierarchy].CurrentMember)",
        description: "Standalone previous month set",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX PREVIOUSMONTH function to MDX ParallelPeriod pattern. " +
      "Uses month level to shift by one month. " +
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

  /**
   * Check if a level actually exists in the dimension hierarchy.
   * Returns false for flat dimensions where the "level" is actually a secondary attribute.
   */
  private levelExistsInDimension(
    dimUniqueName: string | undefined,
    levelName: string,
    context: ConversionContext,
  ): boolean {
    if (!dimUniqueName) {
      return false;
    }

    // Find the dimension in converted results
    for (const dim of context.result.dimensions) {
      if (dim.unique_name === dimUniqueName) {
        // Check if level exists in any hierarchy
        for (const hier of dim.hierarchies || []) {
          for (const level of hier.levels || []) {
            if (level.unique_name === levelName) {
              return true;
            }
          }
        }
        // Also check level_attributes
        for (const la of dim.level_attributes || []) {
          if (la.unique_name === levelName) {
            return true;
          }
        }
        // Level not found
        return false;
      }
    }

    // Dimension not found
    return false;
  }
}
