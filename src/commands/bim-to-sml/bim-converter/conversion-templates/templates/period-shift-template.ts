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
 * Shift type for period shift templates
 */
export type ShiftType = "parallel" | "sameperiodlastyear" | "previousmonth";

/**
 * Configuration for each shift type
 */
interface ShiftConfig {
  daxFunction: string;
  templateName: string;
  timeUnit: "year" | "quarter" | "month" | "day";
  fixedOffset: number | null;  // null means offset comes from DAX args
  methodName: string;
  description: string;
  requiresSimpleMeasureRef: boolean;  // SAMEPERIODLASTYEAR requires simple measure reference
}

const SHIFT_CONFIGS: Record<ShiftType, ShiftConfig> = {
  parallel: {
    daxFunction: "PARALLELPERIOD",
    templateName: "ParallelPeriodTemplate",
    timeUnit: "year",  // Default, but extracted from DAX args
    fixedOffset: null, // Offset comes from DAX args
    methodName: "parallelperiod_template",
    description: "Parallel period using ParallelPeriod",
    requiresSimpleMeasureRef: false,
  },
  sameperiodlastyear: {
    daxFunction: "SAMEPERIODLASTYEAR",
    templateName: "SamePeriodLastYearTemplate",
    timeUnit: "year",
    fixedOffset: 1,
    methodName: "sameperiodlastyear_template",
    description: "Same period last year using ParallelPeriod",
    requiresSimpleMeasureRef: true,
  },
  previousmonth: {
    daxFunction: "PREVIOUSMONTH",
    templateName: "PreviousMonthTemplate",
    timeUnit: "month",
    fixedOffset: 1,
    methodName: "previousmonth_template",
    description: "Previous month using ParallelPeriod",
    requiresSimpleMeasureRef: false,
  },
};

/**
 * PeriodShiftTemplate converts DAX PARALLELPERIOD, SAMEPERIODLASTYEAR, and PREVIOUSMONTH
 * functions to MDX ParallelPeriod pattern.
 *
 * All three share the same core logic - shifting time periods using ParallelPeriod MDX.
 * Parameterized by shift type to handle differences in:
 * - DAX function name
 * - Time unit (year, month, etc.)
 * - Offset (fixed vs. from arguments)
 */
export class PeriodShiftTemplate extends ConversionTemplate {
  readonly name: string;
  readonly confidence = 0.9;
  private readonly config: ShiftConfig;
  private readonly shiftType: ShiftType;

  // Map DAX interval names to time unit types (for PARALLELPERIOD)
  private readonly intervalToTimeUnit: Record<string, "year" | "quarter" | "month" | "day"> = {
    YEAR: "year",
    QUARTER: "quarter",
    MONTH: "month",
    DAY: "day",
  };

  constructor(shiftType: ShiftType) {
    super();
    this.shiftType = shiftType;
    this.config = SHIFT_CONFIGS[shiftType];
    this.name = this.config.templateName;
  }

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    const funcName = token.functionAgg.toUpperCase();

    // Handle CALCULATE(measure, <shiftFunction>(...))
    if (funcName === "CALCULATE") {
      return this.isCalculateWithShiftFunction(token, context);
    }

    // Handle standalone shift function
    if (funcName === this.config.daxFunction) {
      const argCount = this.countArguments(token.args);
      const minArgs = this.shiftType === "parallel" ? 3 : 1;
      if (argCount < minArgs) {
        this.warn(
          `${this.config.daxFunction} function has ${argCount} arguments, expected at least ${minArgs}`,
          context,
        );
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Check if this is CALCULATE([measure], <shiftFunction>(...))
   */
  private isCalculateWithShiftFunction(
    token: FunctionToken,
    context: ConversionContext,
  ): boolean {
    const argGroups = this.splitArguments(token.args);

    if (argGroups.length < 2) {
      return false;
    }

    // Check if any argument is our shift function
    for (let i = 1; i < argGroups.length; i++) {
      const filterArg = argGroups[i];
      if (filterArg.length === 1 && filterArg[0] instanceof FunctionToken) {
        const filterFunc = filterArg[0] as FunctionToken;
        if (filterFunc.functionAgg.toUpperCase() === this.config.daxFunction) {
          // Check for unconvertible functions in the measure argument
          if (this.containsUnconvertibleFunctions(argGroups[0], context)) {
            this.warn(
              `CALCULATE with ${this.config.daxFunction} - measure argument contains unconvertible functions`,
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
        return this.convertCalculateWithShift(token, context);
      } else if (funcName === this.config.daxFunction) {
        return this.convertStandaloneShift(token, context);
      }

      return failedConversion(
        `Unexpected function in ${this.name}: ${funcName}`,
        token.functionAgg,
      );
    } catch (error) {
      return failedConversion(
        `Failed to convert ${this.config.daxFunction}: ${error instanceof Error ? error.message : String(error)}`,
        token.functionAgg,
      );
    }
  }

  /**
   * Convert CALCULATE([measure], <shiftFunction>(...))
   */
  private convertCalculateWithShift(
    token: FunctionToken,
    context: ConversionContext,
  ): ConversionResult {
    const argGroups = this.splitArguments(token.args);

    // First argument: the measure expression
    const measureMdx = this.convertSubExpression(argGroups[0], context);

    // Find the shift function argument
    for (let i = 1; i < argGroups.length; i++) {
      const filterArg = argGroups[i];
      if (filterArg.length === 1 && filterArg[0] instanceof FunctionToken) {
        const filterFunc = filterArg[0] as FunctionToken;
        if (filterFunc.functionAgg.toUpperCase() === this.config.daxFunction) {
          const shiftArgs = this.splitArguments(filterFunc.args);

          // Extract parameters based on shift type
          const params = this.extractShiftParams(shiftArgs, context);
          if (!params.success) {
            return failedConversion(params.error!, token.functionAgg);
          }

          const { dimensionRef, mdxOffset, timeUnit, mdxLevel, dimUniqueName } = params;

          // SAMEPERIODLASTYEAR requires simple measure reference for MDX tuple
          if (this.config.requiresSimpleMeasureRef) {
            const isSimpleMeasureRef = /^\[Measures\]\.\[[^\]]+\]$/.test(measureMdx.trim());
            if (!isSimpleMeasureRef) {
              return failedConversion(
                `${this.config.daxFunction} measure is an expression (${measureMdx}) - MDX tuple requires simple measure reference`,
                token.functionAgg,
              );
            }
          }

          // Validate level exists in dimension hierarchy (for non-SAMEPERIODLASTYEAR)
          if (this.shiftType !== "sameperiodlastyear" && !this.levelExistsInDimension(dimUniqueName, mdxLevel!, context)) {
            return failedConversion(
              `${this.config.daxFunction} requires hierarchy level '${mdxLevel}' but dimension '${dimUniqueName}' has flat structure - time intelligence patterns require multi-level hierarchies`,
              token.functionAgg,
            );
          }

          // Build MDX: (ParallelPeriod([dim].[hier].[Level], offset, [dim].[hier].CurrentMember), [Measures].[measure])
          const mdxExpression = `(ParallelPeriod(${dimensionRef}.[${mdxLevel}], ${mdxOffset}, ${dimensionRef}.CurrentMember), ${measureMdx})`;

          return successfulConversion(
            mdxExpression,
            this.confidence,
            ConversionCategory.TEMPLATE_CONVERSION,
            {
              originalDax: `CALCULATE(..., ${this.config.daxFunction}(...))`,
              method: this.config.methodName,
              note: this.buildNote(mdxOffset!, mdxLevel!),
            },
          );
        }
      }
    }

    return failedConversion(
      `Could not find ${this.config.daxFunction} in CALCULATE arguments`,
      token.functionAgg,
    );
  }

  /**
   * Convert standalone shift function
   */
  private convertStandaloneShift(
    token: FunctionToken,
    context: ConversionContext,
  ): ConversionResult {
    const shiftArgs = this.splitArguments(token.args);

    const params = this.extractShiftParams(shiftArgs, context);
    if (!params.success) {
      return failedConversion(params.error!, token.functionAgg);
    }

    const { dimensionRef, mdxOffset, mdxLevel, dimUniqueName } = params;

    // Validate level exists (for PARALLELPERIOD and PREVIOUSMONTH)
    if (this.shiftType !== "sameperiodlastyear" && !this.levelExistsInDimension(dimUniqueName, mdxLevel!, context)) {
      return failedConversion(
        `${this.config.daxFunction} requires hierarchy level '${mdxLevel}' but dimension '${dimUniqueName}' has flat structure - time intelligence patterns require multi-level hierarchies`,
        token.functionAgg,
      );
    }

    // For standalone, return the ParallelPeriod expression
    const mdxExpression = `ParallelPeriod(${dimensionRef}.[${mdxLevel}], ${mdxOffset}, ${dimensionRef}.CurrentMember)`;

    return successfulConversion(
      mdxExpression,
      this.confidence,
      ConversionCategory.TEMPLATE_CONVERSION,
      {
        originalDax: `${this.config.daxFunction}(...)`,
        method: this.config.methodName,
        note: this.config.description,
      },
    );
  }

  /**
   * Extract shift parameters based on shift type
   */
  private extractShiftParams(
    shiftArgs: DaxToken[][],
    context: ConversionContext,
  ): {
    success: boolean;
    error?: string;
    dimensionRef?: string;
    mdxOffset?: number;
    timeUnit?: "year" | "quarter" | "month" | "day";
    mdxLevel?: string;
    dimUniqueName?: string;
  } {
    if (this.shiftType === "parallel") {
      return this.extractParallelPeriodParams(shiftArgs, context);
    } else {
      return this.extractSimpleShiftParams(shiftArgs, context);
    }
  }

  /**
   * Extract parameters for PARALLELPERIOD (has offset and interval args)
   */
  private extractParallelPeriodParams(
    shiftArgs: DaxToken[][],
    context: ConversionContext,
  ): {
    success: boolean;
    error?: string;
    dimensionRef?: string;
    mdxOffset?: number;
    timeUnit?: "year" | "quarter" | "month" | "day";
    mdxLevel?: string;
    dimUniqueName?: string;
  } {
    if (shiftArgs.length < 3) {
      return {
        success: false,
        error: `PARALLELPERIOD requires 3 arguments, got ${shiftArgs.length}`,
      };
    }

    // Extract date column reference
    const dimensionRef = this.extractDimensionReference(shiftArgs[0], context);
    if (!dimensionRef) {
      return {
        success: false,
        error: `PARALLELPERIOD could not resolve dimension reference from date column`,
      };
    }

    // Extract offset (negate for MDX - DAX -1 means go back, MDX 1 means go back)
    const offset = this.extractOffset(shiftArgs[1]);
    if (offset === undefined) {
      return {
        success: false,
        error: `PARALLELPERIOD could not parse offset from second argument`,
      };
    }
    const mdxOffset = Math.abs(offset);

    // Extract interval (YEAR, QUARTER, MONTH, DAY)
    const interval = this.extractInterval(shiftArgs[2]);
    if (!interval) {
      return {
        success: false,
        error: `PARALLELPERIOD could not parse interval from third argument`,
      };
    }

    const timeUnit = this.intervalToTimeUnit[interval];
    if (!timeUnit) {
      return {
        success: false,
        error: `PARALLELPERIOD unsupported interval: ${interval}`,
      };
    }

    // Resolve the actual level name from the dimension
    const dimUniqueName = extractDimUniqueName(dimensionRef);
    const mdxLevel = dimUniqueName
      ? resolveTimeLevelByUnit(dimUniqueName, timeUnit, context.result, context.bim)
      : undefined;

    if (!mdxLevel) {
      return {
        success: false,
        error: `PARALLELPERIOD requires ${timeUnit} level in dimension hierarchy, but ${dimUniqueName || "unknown dimension"} has no ${timeUnit} level`,
      };
    }

    return {
      success: true,
      dimensionRef,
      mdxOffset,
      timeUnit,
      mdxLevel,
      dimUniqueName,
    };
  }

  /**
   * Extract parameters for SAMEPERIODLASTYEAR and PREVIOUSMONTH (fixed offset/unit)
   */
  private extractSimpleShiftParams(
    shiftArgs: DaxToken[][],
    context: ConversionContext,
  ): {
    success: boolean;
    error?: string;
    dimensionRef?: string;
    mdxOffset?: number;
    timeUnit?: "year" | "quarter" | "month" | "day";
    mdxLevel?: string;
    dimUniqueName?: string;
  } {
    // Get date column tokens (filter out commas)
    const dateColumnTokens = shiftArgs.length > 0 ? shiftArgs[0] : [];
    const dimensionRef = this.extractDimensionReference(dateColumnTokens, context);

    if (!dimensionRef) {
      return {
        success: false,
        error: `${this.config.daxFunction} could not resolve dimension reference from date column`,
      };
    }

    const timeUnit = this.config.timeUnit;
    const mdxOffset = this.config.fixedOffset!;

    // Resolve the actual level name from the dimension
    const dimUniqueName = extractDimUniqueName(dimensionRef);
    const mdxLevel = dimUniqueName
      ? resolveTimeLevelByUnit(dimUniqueName, timeUnit, context.result, context.bim)
      : undefined;

    if (!mdxLevel) {
      const levelName = timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1);
      return {
        success: false,
        error: `${this.config.daxFunction} requires ${levelName} level in dimension hierarchy, but ${dimUniqueName || "unknown dimension"} has no ${levelName} level`,
      };
    }

    return {
      success: true,
      dimensionRef,
      mdxOffset,
      timeUnit,
      mdxLevel,
      dimUniqueName,
    };
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
   * Extract numeric offset from tokens (for PARALLELPERIOD)
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
   * Extract interval name from tokens (for PARALLELPERIOD)
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

  /**
   * Build note for successful conversion
   */
  private buildNote(offset: number, level: string): string {
    if (this.shiftType === "parallel") {
      return `Parallel period shifted by ${offset} ${level}(s)`;
    }
    return this.config.description;
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
        // Also check level_attributes for dimensions with proper levels
        for (const la of dim.level_attributes || []) {
          if (la.unique_name === levelName) {
            return true;
          }
        }
        // Level not found in this dimension
        return false;
      }
    }

    // Dimension not found - can't validate, assume invalid
    return false;
  }

  getExamples(): ConversionExample[] {
    if (this.shiftType === "parallel") {
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
    } else if (this.shiftType === "sameperiodlastyear") {
      return [
        {
          dax: "CALCULATE([Total Sales], SAMEPERIODLASTYEAR(DATE_DIM[D_DATE]))",
          mdx: "(ParallelPeriod([dimension.DATE_DIM].[DATE_DIM Hierarchy].[Year], 1, [dimension.DATE_DIM].[DATE_DIM Hierarchy].CurrentMember), [Measures].[Total Sales])",
          description: "Sales for the same period last year",
        },
        {
          dax: "SAMEPERIODLASTYEAR('Date'[Date])",
          mdx: "ParallelPeriod([dimension.Date].[Date Hierarchy].[Year], 1, [dimension.Date].[Date Hierarchy].CurrentMember)",
          description: "Standalone same period last year set",
        },
      ];
    } else {
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
  }

  getDescription(): string {
    if (this.shiftType === "parallel") {
      return (
        "Converts DAX PARALLELPERIOD function to MDX ParallelPeriod pattern. " +
        "Maps DAX intervals (YEAR, QUARTER, MONTH, DAY) to MDX hierarchy levels. " +
        "Handles both standalone and CALCULATE-wrapped usage."
      );
    } else if (this.shiftType === "sameperiodlastyear") {
      return (
        "Converts DAX SAMEPERIODLASTYEAR function to MDX ParallelPeriod pattern. " +
        "Handles both standalone and CALCULATE-wrapped usage."
      );
    } else {
      return (
        "Converts DAX PREVIOUSMONTH function to MDX ParallelPeriod pattern. " +
        "Uses month level to shift by one month. " +
        "Handles both standalone and CALCULATE-wrapped usage."
      );
    }
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
