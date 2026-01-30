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
 * ClosingBalanceMonthTemplate converts DAX CLOSINGBALANCEMONTH function to MDX.
 *
 * DAX: CLOSINGBALANCEMONTH(SUM(STORE_SALES[SS_NET_PAID]), DATE_DIM[D_DATE])
 * MDX: (ClosingPeriod([dimension.DATE_DIM].[DATE_DIM Hierarchy].[Month]), [Measures].[SS_NET_PAID_sum])
 *
 * CLOSINGBALANCEMONTH returns the value of the expression at the last date of the month
 * in the current context. This is used for semi-additive measures like balances.
 */
export class ClosingBalanceMonthTemplate extends ConversionTemplate {
  readonly name = "ClosingBalanceMonthTemplate";
  readonly confidence = 0.9;

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    if (token.functionAgg.toUpperCase() !== "CLOSINGBALANCEMONTH") {
      return false;
    }

    const argCount = this.countArguments(token.args);
    // CLOSINGBALANCEMONTH requires exactly 2 arguments: expression and dates column
    if (argCount !== 2) {
      this.warn(
        `CLOSINGBALANCEMONTH function has ${argCount} arguments, expected 2`,
        context,
      );
      return false;
    }

    // Check for unconvertible functions in the expression argument
    const argGroups = this.splitArguments(token.args);
    if (argGroups.length > 0 && this.containsUnconvertibleFunctions(argGroups[0], context)) {
      this.warn(
        `CLOSINGBALANCEMONTH expression argument contains unconvertible functions - rejecting conversion`,
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

    if (argGroups.length !== 2) {
      return failedConversion(
        `CLOSINGBALANCEMONTH requires 2 arguments, got ${argGroups.length}`,
        token.functionAgg,
      );
    }

    try {
      // First argument: the measure expression (e.g., SUM(STORE_SALES[SS_NET_PAID]))
      const measureMdx = this.convertSubExpression(argGroups[0], context);

      // Second argument: the date column (e.g., DATE_DIM[D_DATE])
      const dateColumnTokens = argGroups[1];
      const dimensionRef = this.extractDimensionReference(dateColumnTokens, context);

      if (!dimensionRef) {
        return failedConversion(
          `CLOSINGBALANCEMONTH could not resolve dimension reference from date column`,
          token.functionAgg,
        );
      }

      // Build MDX: (ClosingPeriod([dimension].[hierarchy].[Month]), [Measures].[measure])
      // ClosingPeriod returns the last member at a specified level (Month) within the current context
      const mdxExpression = `(ClosingPeriod(${dimensionRef}.[Month]), ${measureMdx})`;

      return successfulConversion(
        mdxExpression,
        this.confidence,
        ConversionCategory.TEMPLATE_CONVERSION,
        {
          originalDax: `CLOSINGBALANCEMONTH(...)`,
          method: "closingbalancemonth_template",
          note: "Closing balance at end of month (semi-additive)",
        },
      );
    } catch (error) {
      return failedConversion(
        `Failed to convert CLOSINGBALANCEMONTH: ${error instanceof Error ? error.message : String(error)}`,
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
    return [
      {
        dax: "CLOSINGBALANCEMONTH(SUM(STORE_SALES[SS_NET_PAID]), DATE_DIM[D_DATE])",
        mdx: "(ClosingPeriod([dimension.DATE_DIM].[DATE_DIM Hierarchy].[Month]), [Measures].[SS_NET_PAID_sum])",
        description: "Closing balance at end of month for semi-additive measure",
      },
      {
        dax: "CLOSINGBALANCEMONTH([Inventory Count], 'Date'[Date])",
        mdx: "(ClosingPeriod([dimension.Date].[Date Hierarchy].[Month]), [Measures].[Inventory Count])",
        description: "Closing balance for inventory measure",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX CLOSINGBALANCEMONTH function to MDX ClosingPeriod pattern. " +
      "Used for semi-additive measures that should report the value at end of month."
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
