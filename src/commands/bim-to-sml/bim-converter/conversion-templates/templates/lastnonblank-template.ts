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
 * LastNonBlankTemplate converts DAX LASTNONBLANK function to MDX.
 *
 * DAX: LASTNONBLANK('Table'[Column], 0)
 * MDX: Tail(NonEmpty([dimension.Table].[Table Hierarchy].Members), 1).Item(0)
 *
 * LASTNONBLANK returns the last non-blank value in a column.
 * This is commonly used for semi-additive snapshot measures where you want
 * the most recent valid value (e.g., current inventory level, latest balance).
 *
 * Note: The second argument in DAX (expression to check) is typically 0 or a constant,
 * which means "use this column's own values". In MDX, NonEmpty filters out blank members.
 */
export class LastNonBlankTemplate extends ConversionTemplate {
  readonly name = "LastNonBlankTemplate";
  readonly confidence = 0.85;

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    if (token.functionAgg.toUpperCase() !== "LASTNONBLANK") {
      return false;
    }

    const argCount = this.countArguments(token.args);
    // LASTNONBLANK requires exactly 2 arguments: column and expression
    if (argCount !== 2) {
      this.warn(
        `LASTNONBLANK function has ${argCount} arguments, expected 2`,
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
        `LASTNONBLANK requires 2 arguments, got ${argGroups.length}`,
        token.functionAgg,
      );
    }

    try {
      // First argument: the column reference (e.g., 'Table'[Column])
      const columnTokens = argGroups[0];
      const { dimensionRef, columnName } = this.extractColumnReference(columnTokens, context);

      if (!dimensionRef) {
        return failedConversion(
          `LASTNONBLANK could not resolve dimension reference from column`,
          token.functionAgg,
        );
      }

      // Build MDX: Tail(NonEmpty([dimension].[hierarchy].Members), 1).Item(0)
      // NonEmpty filters out members with blank values
      // Tail gets the last N members (here 1)
      // Item(0) extracts the single member from the set
      const mdxExpression = `Tail(NonEmpty(${dimensionRef}.Members), 1).Item(0)`;

      return successfulConversion(
        mdxExpression,
        this.confidence,
        ConversionCategory.TEMPLATE_CONVERSION,
        {
          originalDax: `LASTNONBLANK(...)`,
          method: "lastnonblank_template",
          note: `Last non-blank value from ${columnName || "column"} (semi-additive snapshot)`,
        },
      );
    } catch (error) {
      return failedConversion(
        `Failed to convert LASTNONBLANK: ${error instanceof Error ? error.message : String(error)}`,
        token.functionAgg,
      );
    }
  }

  /**
   * Extract dimension hierarchy reference and column name from column tokens
   * E.g., 'Table'[Column] → { dimensionRef: "[dimension.Table].[Table Hierarchy]", columnName: "Column" }
   */
  private extractColumnReference(
    tokens: DaxToken[],
    context: ConversionContext,
  ): { dimensionRef: string | undefined; columnName: string | undefined } {
    for (const token of tokens) {
      if (token instanceof TableColumnReference) {
        const tableName = token.tableName;
        const columnName = token.columnRef?.columnName || "";
        const dimensionRef = resolveDimensionHierarchy(tableName, columnName, context.result, context.bim);
        return { dimensionRef, columnName };
      }
    }

    // Fallback: try to parse from token string representation
    const tokenStr = tokens.map(t => t.toString()).join("");
    const match = tokenStr.match(/['"]?(\w+)['"]?\[(\w+)\]/);
    if (match) {
      const tableName = match[1];
      const columnName = match[2];
      const dimensionRef = resolveDimensionHierarchy(tableName, columnName, context.result, context.bim);
      return { dimensionRef, columnName };
    }

    return { dimensionRef: undefined, columnName: undefined };
  }

  getExamples(): ConversionExample[] {
    return [
      {
        dax: "LASTNONBLANK('CL'[VERSION_CD], 0)",
        mdx: "Tail(NonEmpty([dimension.CL].[CL Hierarchy].Members), 1).Item(0)",
        description: "Last non-blank version code for semi-additive snapshot",
      },
      {
        dax: "LASTNONBLANK(DATE_DIM[D_DATE], 0)",
        mdx: "Tail(NonEmpty([dimension.DATE_DIM].[DATE_DIM Hierarchy].Members), 1).Item(0)",
        description: "Last non-blank date value",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX LASTNONBLANK function to MDX Tail(NonEmpty()) pattern. " +
      "Used for semi-additive measures that need the last non-blank value in a dimension."
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
