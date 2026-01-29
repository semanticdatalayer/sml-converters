import {
  ConversionTemplate,
  ConversionExample,
} from "../template-base";
import { DaxToken, FunctionToken, CommaToken } from "../../dax-converter";
import {
  ConversionResult,
  ConversionCategory,
  successfulConversion,
  failedConversion,
} from "../../conversion-result";
import { ConversionContext } from "../conversion-context";

/**
 * ConcatenateTemplate converts DAX CONCATENATE function to MDX string concatenation.
 *
 * DAX: CONCATENATE(text1, text2)
 * MDX: (text1) + (text2)
 *
 * MDX uses the + operator for string concatenation.
 */
export class ConcatenateTemplate extends ConversionTemplate {
  readonly name = "ConcatenateTemplate";
  readonly confidence = 1.0;

  canConvert(tokens: DaxToken[], context: ConversionContext): boolean {
    if (tokens.length !== 1) {
      return false;
    }

    const token = tokens[0];
    if (!(token instanceof FunctionToken)) {
      return false;
    }

    if (token.functionAgg.toUpperCase() !== "CONCATENATE") {
      return false;
    }

    const argCount = this.countArguments(token.args);
    if (argCount !== 2) {
      this.warn(
        `CONCATENATE function has ${argCount} arguments, expected 2`,
        context,
      );
      return false;
    }

    if (this.containsUnconvertibleFunctions(token.args, context)) {
      this.warn(
        `CONCATENATE arguments contain unconvertible functions - rejecting conversion`,
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
        `CONCATENATE requires 2 arguments, got ${argGroups.length}`,
        token.functionAgg,
      );
    }

    try {
      const text1Mdx = this.convertSubExpression(argGroups[0], context);
      const text2Mdx = this.convertSubExpression(argGroups[1], context);

      if (!text1Mdx || text1Mdx.trim() === "") {
        return failedConversion(
          `CONCATENATE first argument conversion failed`,
          token.functionAgg,
        );
      }
      if (!text2Mdx || text2Mdx.trim() === "") {
        return failedConversion(
          `CONCATENATE second argument conversion failed`,
          token.functionAgg,
        );
      }

      // MDX uses + for string concatenation
      const mdxExpression = `(${text1Mdx}) + (${text2Mdx})`;

      return successfulConversion(
        mdxExpression,
        this.confidence,
        ConversionCategory.TEMPLATE_CONVERSION,
        {
          originalDax: `CONCATENATE(${text1Mdx}, ${text2Mdx})`,
          method: "concatenate_template",
        },
      );
    } catch (error) {
      return failedConversion(
        `Failed to convert CONCATENATE: ${error instanceof Error ? error.message : String(error)}`,
        token.functionAgg,
      );
    }
  }

  getExamples(): ConversionExample[] {
    return [
      {
        dax: 'CONCATENATE("Total: ", [Sales])',
        mdx: '("Total: ") + ([Measures].[Sales])',
        description: "String concatenation with measure",
      },
      {
        dax: 'CONCATENATE([First Name], [Last Name])',
        mdx: '([Measures].[First Name]) + ([Measures].[Last Name])',
        description: "Concatenating two measures",
      },
    ];
  }

  getDescription(): string {
    return (
      "Converts DAX CONCATENATE function to MDX string concatenation using + operator."
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
