import * as fs from "fs";
import * as path from "path";
import {
  ConversionResult,
  ConversionCategory,
  successfulConversion,
  failedConversion,
} from "../conversion-result";
import { DaxToken, FunctionToken } from "../dax-converter";
import { Logger } from "../../../../shared/logger";

/**
 * Registry of DAX function mappings loaded from function-mappings.json
 */
interface FunctionMappings {
  direct_mappings: {
    [daxFunction: string]: string | { mdx: string; arg_order?: number[] };
  };
  unconvertible: string[];
  complex_patterns: string[];
  notes?: {
    [key: string]: string;
  };
}

/**
 * DirectFunctionConverter handles 1:1 DAX to MDX function conversions.
 * Uses function-mappings.json registry for supported function lookup.
 */
export class DirectFunctionConverter {
  private static instance: DirectFunctionConverter;
  private mappings: FunctionMappings;
  private directMappingsCache: Map<string, string | { mdx: string; arg_order?: number[] }>;
  private unconvertibleSet: Set<string>;
  private complexPatternsSet: Set<string>;

  private constructor(private logger: Logger) {
    this.mappings = this.loadFunctionMappings();
    this.directMappingsCache = new Map();
    this.unconvertibleSet = new Set();
    this.complexPatternsSet = new Set();
    this.buildCaches();
  }

  /**
   * Get singleton instance of DirectFunctionConverter
   */
  public static getInstance(logger: Logger): DirectFunctionConverter {
    if (!DirectFunctionConverter.instance) {
      DirectFunctionConverter.instance = new DirectFunctionConverter(logger);
    }
    return DirectFunctionConverter.instance;
  }

  /**
   * Loads function mappings from JSON file
   */
  private loadFunctionMappings(): FunctionMappings {
    const mappingsPath = path.join(
      __dirname,
      "../conversion-templates/function-mappings.json",
    );

    try {
      const data = fs.readFileSync(mappingsPath, "utf-8");
      return JSON.parse(data) as FunctionMappings;
    } catch (error) {
      this.logger.error(
        `Failed to load function mappings from ${mappingsPath}: ${error}`,
      );
      // Return empty mappings if file doesn't exist
      return {
        direct_mappings: {},
        unconvertible: [],
        complex_patterns: [],
      };
    }
  }

  /**
   * Builds caches for fast lookup
   */
  private buildCaches(): void {
    // Build direct mappings cache (case-insensitive)
    for (const [daxFunc, mdxFunc] of Object.entries(
      this.mappings.direct_mappings,
    )) {
      this.directMappingsCache.set(daxFunc.toUpperCase(), mdxFunc);
    }

    // Build unconvertible set (case-insensitive)
    for (const func of this.mappings.unconvertible) {
      this.unconvertibleSet.add(func.toUpperCase());
    }

    // Build complex patterns set (case-insensitive)
    for (const func of this.mappings.complex_patterns) {
      this.complexPatternsSet.add(func.toUpperCase());
    }

    this.logger.debug(
      `Loaded ${this.directMappingsCache.size} direct mappings, ` +
        `${this.unconvertibleSet.size} unconvertible functions, ` +
        `${this.complexPatternsSet.size} complex patterns`,
    );
  }

  /**
   * Checks if a DAX function has a direct 1:1 MDX mapping
   */
  public isSupportedFunction(daxFunction: string): boolean {
    return this.directMappingsCache.has(daxFunction.toUpperCase());
  }

  /**
   * Checks if a DAX function is known to be unconvertible
   */
  public isUnconvertibleFunction(daxFunction: string): boolean {
    return this.unconvertibleSet.has(daxFunction.toUpperCase());
  }

  /**
   * Checks if a DAX function requires complex pattern conversion
   */
  public isComplexPattern(daxFunction: string): boolean {
    return this.complexPatternsSet.has(daxFunction.toUpperCase());
  }

  /**
   * Gets the MDX function name for a DAX function
   * @returns MDX function name or undefined if not supported
   */
  public getMdxFunctionName(daxFunction: string): string | undefined {
    const mapping = this.directMappingsCache.get(daxFunction.toUpperCase());
    if (!mapping) return undefined;

    if (typeof mapping === "string") {
      return mapping;
    } else {
      return mapping.mdx;
    }
  }

  /**
   * Attempts to convert a FunctionToken using direct mapping
   * @param token - DAX function token
   * @param args - Already converted argument strings
   * @returns ConversionResult with MDX expression or failure
   */
  public tryConvert(
    token: FunctionToken,
    args: string[],
  ): ConversionResult {
    const daxFuncName = token.functionAgg.trim();
    const mapping = this.directMappingsCache.get(daxFuncName.toUpperCase());

    if (!mapping) {
      return failedConversion(
        `No direct mapping for function: ${daxFuncName}`,
        daxFuncName,
      );
    }

    let mdxFuncName: string;
    let argOrder: number[] | undefined;

    if (typeof mapping === "string") {
      mdxFuncName = mapping;
    } else {
      mdxFuncName = mapping.mdx;
      argOrder = mapping.arg_order;
    }

    // Reorder arguments if needed
    let orderedArgs = args;
    if (argOrder) {
      orderedArgs = argOrder.map((idx) => args[idx] || "");
    }

    // Build MDX expression
    const mdxExpression = `${mdxFuncName}(${orderedArgs.join(", ")})`;

    return successfulConversion(
      mdxExpression,
      1.0, // Direct mappings have 100% confidence
      ConversionCategory.DIRECT_CONVERSION,
      {
        originalDax: `${daxFuncName}(${args.join(", ")})`,
        method: "direct_mapping",
      },
    );
  }

  /**
   * Gets statistics about function mappings
   */
  public getStats(): {
    directMappings: number;
    unconvertible: number;
    complexPatterns: number;
  } {
    return {
      directMappings: this.directMappingsCache.size,
      unconvertible: this.unconvertibleSet.size,
      complexPatterns: this.complexPatternsSet.size,
    };
  }

  /**
   * Lists all supported DAX functions
   */
  public getSupportedFunctions(): string[] {
    return Array.from(this.directMappingsCache.keys());
  }

  /**
   * Lists all unconvertible DAX functions
   */
  public getUnconvertibleFunctions(): string[] {
    return Array.from(this.unconvertibleSet);
  }

  /**
   * Lists all complex pattern DAX functions
   */
  public getComplexPatternFunctions(): string[] {
    return Array.from(this.complexPatternsSet);
  }
}
