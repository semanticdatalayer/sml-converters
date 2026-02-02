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
} from "../../conversion-pipeline";
import { ConversionContext } from "../conversion-context";
import { resolveDimensionHierarchy, extractDimUniqueName, resolveTimeLevelByUnit } from "../../converter-utils";

/**
 * Period type for total period templates
 */
export type PeriodType = "year" | "month" | "quarter";

/**
 * Configuration for each period type
 */
interface PeriodConfig {
  daxFunction: string;  // TOTALYTD, TOTALMTD, TOTALQTD
  mdxFunction: string;  // YTD, MTD, QTD
  levelUnit: PeriodType;
  levelName: string;    // Year, Month, Quarter
  description: string;
}

const PERIOD_CONFIGS: Record<PeriodType, PeriodConfig> = {
  year: {
    daxFunction: "TOTALYTD",
    mdxFunction: "YTD",
    levelUnit: "year",
    levelName: "Year",
    description: "Year-to-date",
  },
  month: {
    daxFunction: "TOTALMTD",
    mdxFunction: "MTD",
    levelUnit: "month",
    levelName: "Month",
    description: "Month-to-date",
  },
  quarter: {
    daxFunction: "TOTALQTD",
    mdxFunction: "QTD",
    levelUnit: "quarter",
    levelName: "Quarter",
    description: "Quarter-to-date",
  },
};

/**
 * TotalPeriodTemplate converts DAX TOTALYTD/TOTALMTD/TOTALQTD functions to MDX.
 *
 * DAX: TOTALYTD([Total Sales], DATE_DIM[D_DATE])
 * MDX: Sum(YTD([dimension.DATE_DIM].[DATE_DIM Hierarchy].CurrentMember), [Measures].[Total Sales])
 *
 * Parameterized by period type: 'year' | 'month' | 'quarter'
 */
export class TotalPeriodTemplate extends ConversionTemplate {
  readonly name: string;
  readonly confidence = 0.95;
  private readonly config: PeriodConfig;

  constructor(periodType: PeriodType) {
    super();
    this.config = PERIOD_CONFIGS[periodType];
    this.name = `Total${this.config.levelName}Template`;
  }

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    if (token.functionAgg.toUpperCase() !== this.config.daxFunction) {
      return false;
    }

    const argCount = this.countArguments(token.args);
    // TOTAL*TD requires at least 2 arguments: expression and dates column
    // Optional 3rd argument: filter (year_end_date)
    if (argCount < 2) {
      this.warn(
        `${this.config.daxFunction} function has ${argCount} arguments, expected at least 2`,
        context,
      );
      return false;
    }

    // Check for unconvertible functions in the expression argument
    const argGroups = this.splitArguments(token.args);
    if (argGroups.length > 0 && this.containsUnconvertibleFunctions(argGroups[0], context)) {
      this.warn(
        `${this.config.daxFunction} expression argument contains unconvertible functions - rejecting conversion`,
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
        `${this.config.daxFunction} requires at least 2 arguments, got ${argGroups.length}`,
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
          `${this.config.daxFunction} could not resolve dimension reference from date column`,
          token.functionAgg,
        );
      }

      // MDX *TD() function requires a time dimension with the appropriate level
      const dimUniqueName = extractDimUniqueName(dimensionRef);
      const requiredLevel = dimUniqueName
        ? resolveTimeLevelByUnit(dimUniqueName, this.config.levelUnit, context.result, context.bim)
        : undefined;

      if (!requiredLevel) {
        return failedConversion(
          `${this.config.daxFunction} requires ${this.config.levelName} level in time dimension hierarchy, but ${dimUniqueName || "unknown dimension"} has no ${this.config.levelName} level`,
          token.functionAgg,
        );
      }

      // Build MDX: Sum(*TD([dimension].[hierarchy].CurrentMember), [Measures].[measure])
      const mdxExpression = `Sum(${this.config.mdxFunction}(${dimensionRef}.CurrentMember), ${measureMdx})`;

      return successfulConversion(
        mdxExpression,
        this.confidence,
        ConversionCategory.TEMPLATE_CONVERSION,
        {
          originalDax: `${this.config.daxFunction}(...)`,
          method: `total${this.config.levelUnit}td_template`,
          note: `${this.config.description} aggregation`,
        },
      );
    } catch (error) {
      return failedConversion(
        `Failed to convert ${this.config.daxFunction}: ${error instanceof Error ? error.message : String(error)}`,
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
        return resolveDimensionHierarchy(tableName, columnName, context.result, context.bim);
      }
    }

    // Fallback: try to parse from token string representation
    const tokenStr = tokens.map(t => t.toString()).join("");
    const match = tokenStr.match(/['"]?(\w+)['"]?\[(\w+)\]/);
    if (match) {
      const tableName = match[1];
      const columnName = match[2];
      return resolveDimensionHierarchy(tableName, columnName, context.result, context.bim);
    }

    return undefined;
  }

  getExamples(): ConversionExample[] {
    const fn = this.config.daxFunction;
    const mdxFn = this.config.mdxFunction;
    const desc = this.config.description.toLowerCase();

    return [
      {
        dax: `${fn}([Total Sales], DATE_DIM[D_DATE])`,
        mdx: `Sum(${mdxFn}([dimension.DATE_DIM].[DATE_DIM Hierarchy].CurrentMember), [Measures].[Total Sales])`,
        description: `${this.config.description} sales calculation`,
      },
      {
        dax: `${fn}(SUM(Sales[Amount]), 'Date'[Date])`,
        mdx: `Sum(${mdxFn}([dimension.Date].[Date Hierarchy].CurrentMember), [Measures].[Amount_sum])`,
        description: `${desc} with aggregation expression`,
      },
    ];
  }

  getDescription(): string {
    return (
      `Converts DAX ${this.config.daxFunction} function to MDX Sum(${this.config.mdxFunction}()) pattern. ` +
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

// Export convenience factory functions for each period type
export const TotalYtdTemplate = () => new TotalPeriodTemplate("year");
export const TotalMtdTemplate = () => new TotalPeriodTemplate("month");
export const TotalQtdTemplate = () => new TotalPeriodTemplate("quarter");
