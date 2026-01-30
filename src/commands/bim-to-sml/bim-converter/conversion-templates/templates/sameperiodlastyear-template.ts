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
 * SamePeriodLastYearTemplate converts DAX SAMEPERIODLASTYEAR function to MDX.
 *
 * DAX: CALCULATE([Total Sales], SAMEPERIODLASTYEAR(DATE_DIM[D_DATE]))
 * MDX: (ParallelPeriod([dimension.DATE_DIM].[DATE_DIM Hierarchy].[Year], 1, [dimension.DATE_DIM].[DATE_DIM Hierarchy].CurrentMember), [Measures].[Total Sales])
 *
 * SAMEPERIODLASTYEAR returns a set of dates shifted back one year.
 * In MDX, ParallelPeriod with Year level and offset 1 achieves the same result.
 */
export class SamePeriodLastYearTemplate extends ConversionTemplate {
  readonly name = "SamePeriodLastYearTemplate";
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

    // Handle CALCULATE(measure, SAMEPERIODLASTYEAR(...))
    if (funcName === "CALCULATE") {
      return this.isCalculateWithSamePeriodLastYear(token, context);
    }

    // Handle standalone SAMEPERIODLASTYEAR (less common but supported)
    if (funcName === "SAMEPERIODLASTYEAR") {
      const argCount = this.countArguments(token.args);
      if (argCount < 1) {
        this.warn(
          `SAMEPERIODLASTYEAR function has ${argCount} arguments, expected at least 1`,
          context,
        );
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Check if this is CALCULATE([measure], SAMEPERIODLASTYEAR(...))
   */
  private isCalculateWithSamePeriodLastYear(
    token: FunctionToken,
    context: ConversionContext,
  ): boolean {
    const argGroups = this.splitArguments(token.args);

    if (argGroups.length < 2) {
      return false;
    }

    // Check if any argument is SAMEPERIODLASTYEAR
    for (let i = 1; i < argGroups.length; i++) {
      const filterArg = argGroups[i];
      if (filterArg.length === 1 && filterArg[0] instanceof FunctionToken) {
        const filterFunc = filterArg[0] as FunctionToken;
        if (filterFunc.functionAgg.toUpperCase() === "SAMEPERIODLASTYEAR") {
          // Check for unconvertible functions in the measure argument
          if (this.containsUnconvertibleFunctions(argGroups[0], context)) {
            this.warn(
              `CALCULATE with SAMEPERIODLASTYEAR - measure argument contains unconvertible functions`,
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
        return this.convertCalculateWithSamePeriodLastYear(token, context);
      } else if (funcName === "SAMEPERIODLASTYEAR") {
        return this.convertStandaloneSamePeriodLastYear(token, context);
      }

      return failedConversion(
        `Unexpected function in SamePeriodLastYearTemplate: ${funcName}`,
        token.functionAgg,
      );
    } catch (error) {
      return failedConversion(
        `Failed to convert SAMEPERIODLASTYEAR: ${error instanceof Error ? error.message : String(error)}`,
        token.functionAgg,
      );
    }
  }

  /**
   * Convert CALCULATE([measure], SAMEPERIODLASTYEAR(DATE_DIM[D_DATE]))
   */
  private convertCalculateWithSamePeriodLastYear(
    token: FunctionToken,
    context: ConversionContext,
  ): ConversionResult {
    const argGroups = this.splitArguments(token.args);

    // First argument: the measure expression
    const measureMdx = this.convertSubExpression(argGroups[0], context);

    // Find the SAMEPERIODLASTYEAR argument
    for (let i = 1; i < argGroups.length; i++) {
      const filterArg = argGroups[i];
      if (filterArg.length === 1 && filterArg[0] instanceof FunctionToken) {
        const filterFunc = filterArg[0] as FunctionToken;
        if (filterFunc.functionAgg.toUpperCase() === "SAMEPERIODLASTYEAR") {
          const dateColumnTokens = filterFunc.args.filter(
            (t) => !(t instanceof CommaToken),
          );
          const dimensionRef = this.extractDimensionReference(
            dateColumnTokens,
            context,
          );

          if (!dimensionRef) {
            return failedConversion(
              `SAMEPERIODLASTYEAR could not resolve dimension reference from date column`,
              token.functionAgg,
            );
          }

          // Resolve the actual year level name from the dimension
          const dimUniqueName = extractDimUniqueName(dimensionRef);
          const yearLevel = dimUniqueName
            ? resolveTimeLevelByUnit(dimUniqueName, "year", context.result, context.bim)
            : "Year";

          // Build MDX: (ParallelPeriod([dim].[hier].[YearLevel], 1, [dim].[hier].CurrentMember), [Measures].[measure])
          const mdxExpression = `(ParallelPeriod(${dimensionRef}.[${yearLevel}], 1, ${dimensionRef}.CurrentMember), ${measureMdx})`;

          return successfulConversion(
            mdxExpression,
            this.confidence,
            ConversionCategory.TEMPLATE_CONVERSION,
            {
              originalDax: `CALCULATE(..., SAMEPERIODLASTYEAR(...))`,
              method: "sameperiodlastyear_template",
              note: "Same period last year using ParallelPeriod",
            },
          );
        }
      }
    }

    return failedConversion(
      `Could not find SAMEPERIODLASTYEAR in CALCULATE arguments`,
      token.functionAgg,
    );
  }

  /**
   * Convert standalone SAMEPERIODLASTYEAR(DATE_DIM[D_DATE])
   * Returns just the ParallelPeriod set
   */
  private convertStandaloneSamePeriodLastYear(
    token: FunctionToken,
    context: ConversionContext,
  ): ConversionResult {
    const dateColumnTokens = token.args.filter((t) => !(t instanceof CommaToken));
    const dimensionRef = this.extractDimensionReference(dateColumnTokens, context);

    if (!dimensionRef) {
      return failedConversion(
        `SAMEPERIODLASTYEAR could not resolve dimension reference from date column`,
        token.functionAgg,
      );
    }

    // Resolve the actual year level name from the dimension
    const dimUniqueName = extractDimUniqueName(dimensionRef);
    const yearLevel = dimUniqueName
      ? resolveTimeLevelByUnit(dimUniqueName, "year", context.result, context.bim)
      : "Year";

    // For standalone, return the ParallelPeriod expression
    const mdxExpression = `ParallelPeriod(${dimensionRef}.[${yearLevel}], 1, ${dimensionRef}.CurrentMember)`;

    return successfulConversion(
      mdxExpression,
      this.confidence,
      ConversionCategory.TEMPLATE_CONVERSION,
      {
        originalDax: `SAMEPERIODLASTYEAR(...)`,
        method: "sameperiodlastyear_template",
        note: "Same period last year using ParallelPeriod",
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
  }

  getDescription(): string {
    return (
      "Converts DAX SAMEPERIODLASTYEAR function to MDX ParallelPeriod pattern. " +
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
